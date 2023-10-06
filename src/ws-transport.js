import Debug from 'debug'

import { makeDeferred } from './common'

const debug = Debug('ws-transport')

const generateRandomId = () => Math.random().toString(36).slice(2, 8)

const PING_MESSAGE = '>'
const PONG_MESSAGE = '<'
const PING_TIMED_OUT_ERROR_PAYLOAD = {
  payload: {
    status: 0,
    title: 'Ping timed out',
    type: 'ping_timed_out',
  },
  type: 'recoverable_session_error',
}
const WS_CLOSED_ERROR_PAYLOAD = {
  payload: {
    status: 0,
    title: 'Connection closed',
    type: 'ws_error',
  },
  type: 'unrecoverable_session_error',
}

class WsTransport {
  constructor() {
    this.connected = false
    this.connectedPromise = makeDeferred()
    this.disconnectedPromise = makeDeferred()
    this.forcedDisconnect = false
    this.id = generateRandomId()
    this.lastError = undefined
    this.messageHandler = undefined
    this.pingInterval = undefined // in ms
    this.pingTimerId = undefined
    this.socket = undefined
  }

  async connect(url) {
    this.socket = new WebSocket(url)

    debug(`[${this.id}] socket created`)

    this.socket.addEventListener('close', (closeEvent) => {
      debug(`[${this.id}] close event`, closeEvent)

      if (this.forcedDisconnect) return

      // not used at this time
      // const { code, wasClean } = closeEvent
      // const closeMeta = { code, wasClean }

      // connected | forcedDisconnect | reason                                    |
      // -------------------------------------------------------------------------|
      // false     | false            | closed before open event
      // false     | true             | manual disconnect (before open event)
      // true      | false            | disconnect with or without error (server or browser)
      // true      | true             | manual disconnect (no error)

      const maybeError = this.lastError || WS_CLOSED_ERROR_PAYLOAD

      if (this.connected) {
        this.disconnectedPromise.resolve(maybeError)
      } else {
        this.connectedPromise.reject(maybeError)
        this.disconnectedPromise.reject(maybeError)
      }

      this.connected = false
    })

    this.socket.addEventListener('error', (errorEvent) => {
      debug(`[${this.id}] error event`, errorEvent)

      if (this.forcedDisconnect) return

      this.lastError = WS_CLOSED_ERROR_PAYLOAD
    })

    this.socket.addEventListener('open', () => {
      debug(`[${this.id}] open event`)

      if (this.forcedDisconnect) return

      this.connected = true

      this.connectedPromise.resolve()
    })

    this.socket.addEventListener('message', (messageEvent) => {
      debug(`[${this.id}] message event`, messageEvent.data)

      if (messageEvent.data === PING_MESSAGE) {
        this.socket.send(PONG_MESSAGE)

        if (this.pingInterval) {
          if (this.pingTimerId) {
            clearTimeout(this.pingTimerId)
          }

          this.pingTimerId = setTimeout(() => {
            if (this.pingTimerId) {
              clearTimeout(this.pingTimerId)
            }

            this.close(PING_TIMED_OUT_ERROR_PAYLOAD)
          }, this.pingInterval)
        }

        return
      }

      if (this.forcedDisconnect || !this.messageHandler) return

      const data = JSON.parse(messageEvent.data)

      this.messageHandler(data)
    })

    return this.connectedPromise.promise
  }

  disconnected() {
    return this.disconnectedPromise.promise
  }

  close(reason) {
    if (!this.socket) return

    if (this.pingTimerId) {
      clearTimeout(this.pingTimerId)
    }

    this.forcedDisconnect = true

    this.socket.close()

    if (this.connected) {
      this.connected = false

      this.disconnectedPromise.resolve(reason)
    } else {
      this.connectedPromise.reject(reason)
      this.disconnectedPromise.reject(reason)
    }
  }

  send(payload) {
    if (!this.connected) return

    this.socket.send(JSON.stringify(payload))
  }

  setMessageHandler(handler) {
    this.messageHandler = handler
  }

  setPingInterval(value) {
    this.pingInterval = value
  }
}

export default WsTransport
