/* eslint-disable unicorn/no-abusive-eslint-disable, unicorn/numeric-separators-style */
import { connect, jwtAuthenticator, JSONCodec } from 'nats.ws/lib/src/mod'

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
    this.handlers = {}
    this.natsConnection = undefined
    this.topic = ''
    this.trackError = undefined
  }

  isClosed() {
    if (!this.natsConnection) return true

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
    const { classId, name, token } = options
    const { pingInterval, timeout } = this.defaultOptions
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

      this.natsConnection = await connect({
        ...this.defaultOptions,
        authenticator: jwtAuthenticator(token),
        name,
        noEcho: true,
        pingInterval,
        reconnect: false,
        servers: this.endpoint,
        timeout,
      })

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

      done = this.natsConnection
        .closed()
        .then((error) => {
          // eslint-disable-next-line promise/always-return
          if (error) {
            console.log('[NATS] Connection closed with error:', error) // eslint-disable-line no-console

            if (this.trackError) this.trackError(error)
          }
        })
        .catch((error) => console.log('[NATS] Catch closing error:', error)) // eslint-disable-line no-console
    } catch (error) {
      if (this.trackError) this.trackError(error)

      console.log('[NATS] Error connecting to server:', error) // eslint-disable-line no-console
    }

    return done
  }

  /**
   * Disconnect from NATS server
   *
   * @return {Promise<void>}
   */
  async disconnect() {
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
   * Set error tracker
   * @param {function} trackError
   */
  setErrorTracker(trackError) {
    this.trackError = trackError
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
