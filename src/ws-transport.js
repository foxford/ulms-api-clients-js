import Debug from 'debug'

import { makeDeferred } from './common'

const debug = Debug('ws-transport')

const generateRandomId = () => Math.random().toString(36).slice(2, 8)

const KEEP_ALIVE_MESSAGE = '-'
const KEEP_ALIVE_TIMED_OUT_ERROR_PAYLOAD = {
  payload: {
    is_transient: true,
    title: 'Keep alive timed out',
    type: 'keep_alive_timed_out',
  },
  type: 'error',
}
const WS_CLOSED_ERROR_PAYLOAD = {
  payload: {
    is_transient: true,
    title: 'Connection closed',
    type: 'ws_error',
  },
  type: 'error',
}

class WsTransport {
  constructor() {
    this.connected = false
    this.connectedPromise = makeDeferred()
    this.disconnectedPromise = makeDeferred()
    this.forcedDisconnect = false
    this.id = generateRandomId()
    this.idleTimeout = undefined // in ms
    this.idleTimerId = undefined
    this.lastError = undefined
    this.messageHandler = undefined
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

      if (messageEvent.data === KEEP_ALIVE_MESSAGE) {
        this.socket.send(KEEP_ALIVE_MESSAGE)

        if (this.idleTimeout) {
          this.setIdleTimer()
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

    this.clearIdleTimer()

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

  setIdleTimeout(value) {
    this.idleTimeout = value
  }

  clearIdleTimer() {
    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId)
    }
  }

  setIdleTimer() {
    this.clearIdleTimer()

    this.idleTimerId = setTimeout(() => {
      this.clearIdleTimer()

      this.close(KEEP_ALIVE_TIMED_OUT_ERROR_PAYLOAD)
    }, this.idleTimeout)
  }
}

export default WsTransport
