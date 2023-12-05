/* eslint-disable unicorn/no-abusive-eslint-disable, unicorn/numeric-separators-style */
/* global window */
import {
  JSONCodec,
  NatsError,
  connect,
  jwtAuthenticator,
} from 'nats.ws/lib/src/mod'

const jsonCodec = JSONCodec()

class NATSClient {
  /**
   * Create compound message name from component name and message type
   * @param {string} component - Component name
   * @param {string} type - Message type
   * @return {string} Message type
   */
  static makeMessageType = (component, type) => `${component}.${type}`

  constructor(endpoint, defaultOptions = {}) {
    this.defaultOptions = defaultOptions
    this.endpoint = endpoint
    this.forcedStop = false
    this.handlers = {}
    this.natsConnection = undefined
    this.responders = {}
    this.topic = ''
    this.trackError = undefined
    this.trackEvent = undefined
  }

  isClosed() {
    if (!this.natsConnection) return false

    return this.natsConnection.isClosed()
  }

  /**
   * Connect to NATS server
   * @param {{ classId: string, name: string, token: string }} options
   *
   * @return {Promise<void>}
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async connect(options) {
    const { accountLabel, classId, name, token } = options
    const { pingInterval, timeout } = this.defaultOptions
    const inboxPrefix = accountLabel
      ? `agent.${accountLabel}.response.${classId}`
      : undefined
    let done
    let reconnectCount = 0

    this.topic = `classrooms.${classId}.unreliable`

    try {
      console.log('[NATS] connection: start') // eslint-disable-line no-console

      if (!pingInterval) {
        console.warn('[NATS] `pingInterval` value not set') // eslint-disable-line no-console
      }

      if (!timeout) {
        console.warn('[NATS] `timeout` value not set') // eslint-disable-line no-console
      }

      const t0 = window.performance.now()

      this.natsConnection = await connect({
        ...this.defaultOptions,
        authenticator: jwtAuthenticator(token),
        inboxPrefix,
        name,
        noEcho: true,
        pingInterval,
        reconnect: false,
        servers: this.endpoint,
        timeout,
      })

      const t1 = window.performance.now()

      if (this.trackEvent) {
        this.trackEvent('Debug', 'NATS.ConnectTime', 'v1', (t1 - t0).toFixed(0))
      }

      console.log('[NATS] connection: success') // eslint-disable-line no-console

      /* eslint-disable */
      ;(async () => {
        for await (const status of this.natsConnection.status()) {
          if (status.type === 'pingTimer') continue

          console.log(`[NATS] ${status.type}:`, status.data)

          if (status.type === 'reconnecting') {
            reconnectCount += 1

            console.log('[NATS] reconnect count:', reconnectCount)
          }

          if (status.type === 'reconnect') {
            reconnectCount = 0
          }
        }
      })()
        .then()
        .catch()
      /* eslint-enable */

      this.natsConnection.subscribe(this.topic, {
        callback: (error, sourceMessage) => {
          if (error) {
            console.log('[NATS] Error receiving message:', error) // eslint-disable-line no-console

            if (this.trackError) this.trackError(error)

            return
          }

          const message = jsonCodec.decode(sourceMessage.data)

          if (this.handlers[message.type]) {
            this.handlers[message.type](message.data)
          }
        },
      })

      if (accountLabel) {
        this.natsConnection.subscribe(
          `agent.${accountLabel}.request.${classId}`,
          {
            callback: (error, sourceMessage) => {
              if (error) {
                console.log('[NATS] Error receiving message:', error) // eslint-disable-line no-console

                if (this.trackError) this.trackError(error)

                return
              }

              const message = jsonCodec.decode(sourceMessage.data)

              if (sourceMessage.reply && this.responders[message.type]) {
                const response = this.responders[message.type](message.data)

                sourceMessage.respond(jsonCodec.encode(response))
              }
            },
          }
        )
      }

      done = this.natsConnection
        .closed()
        .then((error) => {
          // eslint-disable-next-line promise/always-return
          if (error) {
            console.log('[NATS] Connection closed with error:', error) // eslint-disable-line no-console

            if (this.trackError) this.trackError(error)
          }

          const t2 = window.performance.now()

          // eslint-disable-next-line promise/always-return
          if (this.trackEvent) {
            this.trackEvent(
              'Debug',
              'NATS.Disconnect',
              'v1',
              (t2 - t1).toFixed(0),
              { reason: error || null } // eslint-disable-line unicorn/no-null
            )
          }
        })
        .catch((error) => console.log('[NATS] Catch closing error:', error)) // eslint-disable-line no-console
    } catch (error) {
      if (this.trackError) this.trackError(error)
      if (this.trackEvent) {
        let errorMeta = error

        if (error instanceof NatsError) {
          const { code, message, name: errorName } = error

          errorMeta = { code, message, name: errorName }
        }

        this.trackEvent('Debug', 'NATS.Error', 'v1', undefined, {
          error: errorMeta,
        })
      }

      console.log('[NATS] Error connecting to server:', error) // eslint-disable-line no-console
    }

    // handle early disconnect
    if (this.forcedStop) {
      this.disconnect()

      return
    }

    // eslint-disable-next-line consistent-return
    return done
  }

  /**
   * Disconnect from NATS server
   *
   * @return {Promise<void>}
   */
  async disconnect() {
    this.forcedStop = true

    if (!this.natsConnection) return

    try {
      this.natsConnection.protocol.abortReconnect = true // hack to prevent reconnects in Safari

      await this.natsConnection.close()

      this.natsConnection = undefined

      console.log('[NATS] connection: closed') // eslint-disable-line no-console
    } catch (error) {
      if (this.trackError) this.trackError(error)

      console.log('[NATS] Error closing connection:', error) // eslint-disable-line no-console
    }
  }

  /**
   * Register responder to exact type of messages
   * @param {string} type - Message type
   * @param {function} responder
   */
  registerResponder(type, responder) {
    this.responders[type] = responder
  }

  /**
   * Send request
   * @param {string} receiver - Account ID of receiver
   * @param {string} classId - Class id
   * @param {string} type - Request type
   * @param {object} data - Request payload
   * @param {object} requestOptions - Request options
   */
  request(receiver, classId, type, data, requestOptions = {}) {
    if (!this.natsConnection) return Promise.reject()

    const { timeout = 5000 } = requestOptions
    const t0 = window.performance.now()
    const requestPromise = this.natsConnection.request(
      `agent.${receiver}.request.${classId}`,
      jsonCodec.encode({ type, data }),
      { timeout }
    )

    if (this.trackEvent) {
      try {
        // eslint-disable-next-line promise/catch-or-return
        requestPromise
          // eslint-disable-next-line promise/always-return
          .then((response) => {
            const { method, type: dataType } = data
            const t1 = window.performance.now()
            const meta = {
              classId,
              error: null, // eslint-disable-line unicorn/no-null
              method,
              response: jsonCodec.decode(response.data),
              responseTime: Math.floor(t1 - t0),
              type: dataType,
            }

            this.trackEvent('Debug', 'NATS.request', 'v1', 'success', meta)
          })
          .catch((error) => {
            const { method, type: dataType } = data
            const t1 = window.performance.now()
            const meta = {
              classId,
              error: error ? `${error.name}: ${error.message}` : '',
              method,
              response: null, // eslint-disable-line unicorn/no-null
              responseTime: Math.floor(t1 - t0),
              type: dataType,
            }

            this.trackEvent('Debug', 'NATS.request', 'v1', 'error', meta)
          })
      } catch (error) {
        if (this.trackError) {
          this.trackError(error)
        }
      }
    }

    return requestPromise
  }

  /**
   * Set error tracker
   * @param {function} trackError
   */
  setErrorTracker(trackError) {
    this.trackError = trackError
  }

  /**
   * Set event tracker
   * @param {function} trackEvent
   */
  setEventTracker(trackEvent) {
    this.trackEvent = trackEvent
  }

  /**
   * Subscribe to exact type of messages
   * @param {string} type - Message type
   * @param {function} handler
   */
  subscribe(type, handler) {
    this.handlers[type] = handler
  }

  /**
   * Unsubscribe from exact type of messages
   * @param {string} type - Message type
   */
  unsubscribe(type) {
    delete this.handlers[type]
  }

  /**
   * Publish message
   * @param {string} type - Message type
   * @param {object} data - Message payload
   */
  publish(type, data) {
    try {
      const message = {
        type,
        data,
      }

      if (
        this.natsConnection &&
        !this.natsConnection.isClosed() &&
        this.natsConnection.protocol.transport.socket.readyState ===
          WebSocket.OPEN
      ) {
        this.natsConnection.publish(this.topic, jsonCodec.encode(message))
      }
    } catch (error) {
      console.log('[NATS] Could not publish message', error) // eslint-disable-line no-console

      if (this.trackError) this.trackError(error)
    }
  }
}

export default NATSClient
