/* global window */
import Debug from 'debug'

import { makeDeferred } from './common'

const debug = Debug('ws-transport')

const generateRandomId = () => window.crypto.randomUUID().split('-')[0]

class WsTransport {
  constructor() {
    this.connected = false
    this.connectedPromise = makeDeferred()
    this.disconnectedPromise = makeDeferred()
    this.forcedDisconnect = false
    this.id = generateRandomId()
    this.lastError = undefined
    this.messageHandler = undefined
    this.socket = undefined
  }

  async connect(url) {
    this.socket = new WebSocket(url)

    this.socket.addEventListener('close', (closeEvent) => {
      debug(`[${this.id}] close event`, closeEvent)

      if (this.forcedDisconnect) return

      const { code, wasClean } = closeEvent
      const closeMeta = { code, wasClean }

      // connected | forcedDisconnect | reason                                    |
      // -------------------------------------------------------------------------|
      // false     | false            | closed before open event
      // false     | true             | manual disconnect (before open event)
      // true      | false            | disconnect with or without error (server or browser)
      // true      | true             | manual disconnect (no error)

      const maybeError = this.lastError || closeMeta

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

      this.lastError = errorEvent
    })

    this.socket.addEventListener('open', () => {
      debug(`[${this.id}] open event`)

      if (this.forcedDisconnect) return

      this.connected = true

      this.connectedPromise.resolve()
    })

    this.socket.addEventListener('message', (messageEvent) => {
      debug(`[${this.id}] message event`, messageEvent.data)

      if (this.forcedDisconnect || !this.messageHandler) return

      const data = JSON.parse(messageEvent.data)

      this.messageHandler(data)
    })

    return this.connectedPromise.promise
  }

  disconnected() {
    return this.disconnectedPromise.promise
  }

  close() {
    if (!this.socket) return

    this.forcedDisconnect = true

    this.socket.close()

    if (this.connected) {
      this.connected = false

      this.disconnectedPromise.resolve()
    } else {
      this.connectedPromise.reject()
      this.disconnectedPromise.reject()
    }
  }

  send(payload) {
    if (!this.connected) return

    this.socket.send(JSON.stringify(payload))
  }

  setMessageHandler(handler) {
    this.messageHandler = handler
  }
}

export default WsTransport
