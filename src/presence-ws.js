// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import { makeDeferred } from './common'
import { PresenceError } from './error'

class PresenceWS extends EventEmitter {
  constructor() {
    super()

    this.connected = false
    this.connectedPromise = undefined
    this.disconnectedPromise = undefined
    this.forcedDisconnect = false
    this.lastProtocolError = undefined
    this.lastTransportError = undefined
    this.ws = undefined
  }

  static get eventTypes() {
    return {
      AGENT_ENTER: 'agent.enter',
      AGENT_LEAVE: 'agent.leave',
    }
  }

  connect(connectOptions) {
    // todo: check if connected and reject?? or disconnect and connect??
    const { agentLabel, classroomId, token, url } = connectOptions
    const connectRequestPayload = {
      type: 'connect_request',
      payload: {
        agent_label: agentLabel,
        classroom_id: classroomId,
        token,
      },
    }

    this.connectedPromise = makeDeferred()
    this.forcedDisconnect = false
    this.lastProtocolError = undefined
    this.lastTransportError = undefined
    this.ws = new WebSocket(url)

    this.ws.addEventListener('close', (closeEvent) => {
      console.log('[PresenceWS] closed', closeEvent)

      if (this.connected) {
        const error =
          this.lastProtocolError ||
          (this.forcedDisconnect
            ? undefined
            : PresenceError.fromType(PresenceError.types.WS_ERROR))

        this.disconnectedPromise.resolve(error)
      } else {
        const error =
          this.lastProtocolError ||
          (this.lastTransportError &&
            PresenceError.fromType(PresenceError.types.CONNECTION_FAILED))

        this.connectedPromise.reject(error)
      }
    })

    this.ws.addEventListener('error', (errorEvent) => {
      console.log('[PresenceWS] error', errorEvent)

      this.lastTransportError = errorEvent
    })

    this.ws.addEventListener('open', () => {
      console.log('[PresenceWS] opened')

      this.ws.send(JSON.stringify(connectRequestPayload))
    })

    this.ws.addEventListener('message', (messageEvent) => {
      console.log('[PresenceWS] message', JSON.parse(messageEvent.data))

      // Notification example
      // { type: 'event', payload: {...}, label: 'example.string' }

      // Error example
      // { type: 'connect_failure', payload: { status: 403, type: 'access_denied', title: 'Access Denied' }}
      const data = JSON.parse(messageEvent.data)
      const { label, payload, type } = data

      switch (type) {
        case 'connect_failure':
          this.lastProtocolError = PresenceError.fromType(
            payload.type.toUpperCase()
          )

          break
        case 'connect_success':
          this.connected = true
          this.disconnectedPromise = makeDeferred()

          this.connectedPromise.resolve()

          break
        case 'event':
          this.processEvent(label, payload)

          break
        default:
        // do nothing
      }
    })

    return this.connectedPromise.promise
  }

  disconnect() {
    this.forcedDisconnect = true

    this.ws.close()
  }

  disconnected() {
    if (!this.connected) {
      return Promise.reject(
        PresenceError.fromType(PresenceError.types.NOT_CONNECTED)
      )
    }

    return this.disconnectedPromise.promise
  }

  processEvent(label, payload) {
    switch (label) {
      case 'agent.auth_timed_out':
      case 'agent.replaced':
        this.lastProtocolError = PresenceError.fromType(
          label.replace('.', '_').toUpperCase()
        )

        break
      default:
        this.emit(label, payload)
    }
  }
}

export default PresenceWS
