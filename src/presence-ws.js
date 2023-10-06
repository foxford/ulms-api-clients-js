/* eslint-disable no-await-in-loop */
import Debug from 'debug'
import EventEmitter from 'events' // eslint-disable-line unicorn/prefer-node-protocol

import { makeDeferred } from './common'
import { PresenceError } from './error'
import WsTransport from './ws-transport'

const debug = Debug('presence-ws')

const CONNECT_REQUEST_TYPE = 'connect_request'
const CONNECT_SUCCESS_RESPONSE_TYPE = 'connect_success'
const WS_CLIENT_CONFIG_PAYLOAD_TYPE = 'WebSocketClientConfig'

// todo: add client timeout for connection start
// todo: - connect timeout - from start to open event
// todo: - auth timeout - from request to response
class PresenceWS extends EventEmitter {
  constructor(url, tokenProvider) {
    super()

    this.connected = false
    this.connectedPromise = makeDeferred()
    this.disconnectedPromise = makeDeferred()
    this.lastProtocolError = undefined
    this.recoverableErrorReceived = makeDeferred()
    this.signal = makeDeferred()
    this.tokenProvider = tokenProvider
    this.transport = undefined
    this.url = url
  }

  async createTransport(options) {
    const { agentLabel, classroomId } = options
    const token = await Promise.race([
      this.signal.promise,
      this.tokenProvider.getToken(),
    ])

    const connectRequestPayload = {
      payload: {
        agent_label: agentLabel,
        classroom_id: classroomId,
        token,
      },
      type: CONNECT_REQUEST_TYPE,
    }
    const connected = makeDeferred()
    const transport = new WsTransport()
    const handler = (message) => {
      const { type, payload } = message

      transport.setMessageHandler()

      if (type === CONNECT_SUCCESS_RESPONSE_TYPE) {
        if (payload) {
          const { ping_timeout: pingTimeout, type: payloadType } = payload

          if (payloadType === WS_CLIENT_CONFIG_PAYLOAD_TYPE && pingTimeout) {
            transport.setPingInterval(pingTimeout)
          }
        }

        connected.resolve()
      } else {
        connected.reject(message)
      }
    }

    transport.setMessageHandler(handler)

    try {
      await Promise.race([this.signal.promise, transport.connect(this.url)])
      // transport connected

      // send auth request
      transport.send(connectRequestPayload)

      // wait for event 'connect_success'
      await Promise.race([this.signal.promise, connected.promise])
    } catch (error) {
      debug('[createTransport] catch', error)

      transport.close()

      throw error
    }

    return transport
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async flow(options) {
    let previousTransport

    this.lastProtocolError = undefined
    this.connectedPromise = makeDeferred()
    this.disconnectedPromise = makeDeferred()
    this.signal = makeDeferred()

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const p = this.createTransport(options) // throws

        this.transport = previousTransport
          ? await Promise.race([previousTransport.disconnected(), p]).then(
              // eslint-disable-next-line no-loop-func
              (result) => {
                // if previousTransport closed with replaced error, ignore and return
                if (
                  previousTransport &&
                  PresenceError.isReplacedError(this.lastProtocolError)
                ) {
                  return p
                }

                // otherwise, throw error
                throw result
              }
            )
          : await p
        // connected transport
        debug('[flow] transport connected')

        this.processEvent('connect')

        if (previousTransport) {
          previousTransport.close()

          previousTransport = undefined
        }

        this.lastProtocolError = undefined
        this.recoverableErrorReceived = makeDeferred() // renew deferred

        this.transport.setMessageHandler(this.handleMessage.bind(this))

        if (!this.connected) {
          this.connected = true
          this.connectedPromise.resolve()
        }

        debug('[flow] awaiting disconnect or recoverable error...')

        const maybeDisconnectReason = await Promise.race([
          this.transport.disconnected(),
          this.recoverableErrorReceived.promise,
        ])

        if (
          maybeDisconnectReason === undefined ||
          (maybeDisconnectReason &&
            maybeDisconnectReason.payload &&
            maybeDisconnectReason.payload.type !==
              PresenceError.recoverableTypes.TERMINATED)
        ) {
          debug('[flow] transport disconnected, throw')

          throw maybeDisconnectReason
        }

        // received recoverable_session_error
        debug('[flow] received recoverable_session_error TERMINATED')

        previousTransport = this.transport
      }
    } catch (error) {
      debug('[flow] catch', error)

      // if error = undefined - normal disconnect (manual)
      const reason = error
        ? error.payload && error.payload.type
          ? PresenceError.fromType(error.payload.type.toUpperCase())
          : error
        : undefined

      this.signal.reject()

      if (previousTransport) {
        previousTransport.close()

        previousTransport = undefined
      }

      if (this.transport) {
        this.transport.close()

        this.transport = undefined
      }

      if (!this.connected) {
        this.connectedPromise.reject(this.lastProtocolError || reason)
      }

      this.connected = false

      this.disconnectedPromise.resolve(this.lastProtocolError || reason)
    }
  }

  handleMessage(message) {
    const { payload, type } = message

    debug('[handleMessage] message', message)

    if (type !== undefined) {
      // process service system messages (response, error)
      this.lastProtocolError = PresenceError.fromType(
        payload.type.toUpperCase()
      )

      // if (type === 'recoverable_session_error') {
      if (PresenceError.isRecoverableSessionError(message)) {
        this.recoverableErrorReceived.resolve(this.lastProtocolError)
      }
    } else {
      // process service notification
      this.processEvent('event', message)
    }
  }

  connect(connectOptions) {
    this.flow(connectOptions)

    return this.connectedPromise.promise
  }

  disconnect() {
    this.connectedPromise.reject()
    this.signal.reject()

    this.connected = false

    if (this.transport) {
      this.transport.close()
    }
  }

  disconnected() {
    if (!this.connected) {
      return Promise.reject(
        PresenceError.fromType(PresenceError.unrecoverableTypes.NOT_CONNECTED)
      )
    }

    return this.disconnectedPromise.promise
  }

  processEvent(label, payload) {
    this.emit(label, payload)
  }
}

export default PresenceWS
