/* eslint-disable max-classes-per-file */
/* global bowser, mqtt */

// using version from cdn
// import mqtt from 'mqtt'

import Backoff from './backoff'
import { sleep } from './common'
import { mqttReasonCodeNameEnum } from './constants'
import retry from './retry'
import loadScript from './script-loader'

const defaultOptions = {
  keepalive: 10,
  properties: {
    userProperties: {
      connection_mode: 'default',
      connection_version: 'v2',
    },
  },
  protocolVersion: 5,
  reconnectPeriod: 0,
  username: '',
}

class MQTTClient {
  static get events() {
    return {
      CONNECT: 'connect',
      RECONNECT: 'reconnect',
      CLOSE: 'close',
      OFFLINE: 'offline',
      ERROR: 'error',
      END: 'end',
      MESSAGE: 'message',
      PACKETSEND: 'packetsend',
      PACKETRECEIVE: 'packetreceive',
    }
  }

  static async loadDependencies() {
    const isBigIntSupported = typeof BigInt !== 'undefined'
    const isOldBrowserVersion = bowser
      .getParser(window.navigator.userAgent)
      .satisfies({
        safari: '<15',
      })
    const mqttVersion =
      isBigIntSupported && !isOldBrowserVersion ? '5.9.1' : '3.0.0'
    const source = `https://static.ngcdn.ru/js-libs/mqtt@${mqttVersion}/dist/mqtt.min.js`

    return retry(() => loadScript(source))
  }

  constructor(url) {
    this.client = undefined
    this.url = url
  }

  get connected() {
    return this.client.connected
  }

  get disconnected() {
    return this.client.disconnected
  }

  get disconnecting() {
    return this.client.disconnecting
  }

  get reconnecting() {
    return this.client.reconnecting
  }

  connect(options) {
    this.client = mqtt.connect(this.url, options)
  }

  disconnect(...arguments_) {
    this.client.end(...arguments_)
  }

  reconnect() {
    this.client.reconnect()
  }

  subscribe(topic, options, callback) {
    this.client.subscribe(topic, options, callback)
  }

  unsubscribe(topic, callback) {
    this.client.unsubscribe(topic, callback)
  }

  publish(topic, message, options, callback) {
    this.client.publish(topic, message, options, callback)
  }

  on(eventName, eventHandler) {
    this.client.on(eventName, eventHandler)
  }

  off(eventName, eventHandler) {
    this.client.removeListener(eventName, eventHandler)
  }
}

class ReconnectingMQTTClient extends MQTTClient {
  constructor(url, tokenProvider, reconnectLimit) {
    super(url)

    this.backoff = new Backoff()
    this.forcedClose = false
    this.reconnectCount = 0
    this.reconnectLimit = reconnectLimit || 3
    this.tokenProvider = tokenProvider
    this.tokenProviderPromise = undefined
    this.trackEvent = undefined

    this.handleCloseEvent = this.handleCloseEvent.bind(this)
    this.handleConnectEvent = this.handleConnectEvent.bind(this)
    this.handlePacketReceiveEvent = this.handlePacketReceiveEvent.bind(this)
    this.handleReconnectEvent = this.handleReconnectEvent.bind(this)
  }

  bindEventListeners() {
    this.client.on(ReconnectingMQTTClient.events.CLOSE, this.handleCloseEvent)
    this.client.on(
      ReconnectingMQTTClient.events.CONNECT,
      this.handleConnectEvent,
    )
    this.client.on(
      ReconnectingMQTTClient.events.PACKETRECEIVE,
      this.handlePacketReceiveEvent,
    )
    this.client.on(
      ReconnectingMQTTClient.events.RECONNECT,
      this.handleReconnectEvent,
    )
  }

  handleCloseEvent(error) {
    if (error) {
      console.error('[mqttClient] close with error', error, error.toString())
    }

    console.log('[mqttClient] close, forced:', this.forcedClose)

    if (this.reconnectCount >= this.reconnectLimit) {
      this.disconnect()

      // onCloseHandler && onCloseHandler(RECONNECT_LIMIT_EXCEEDED)
      // this.client.emit('reconnect_limit_exceeded')
    } else if (!this.forcedClose) {
      this.reconnect()
    }
  }

  handleConnectEvent() {
    console.log('[mqttClient] connected')

    this.forcedClose = false
    this.reconnectCount = 0

    this.backoff.reset()
  }

  handlePacketReceiveEvent(packet) {
    if (
      packet &&
      packet.reasonCode > 0 &&
      mqttReasonCodeNameEnum[packet.reasonCode]
    ) {
      const { cmd, reasonCode } = packet

      // eslint-disable-next-line no-console
      console.debug(
        `[mqtt] Command '${cmd}', reasonCode ${reasonCode} (${mqttReasonCodeNameEnum[reasonCode]})`,
      )

      if (this.trackEvent) {
        // eslint-disable-next-line unicorn/no-null
        this.trackEvent('Debug', 'MQTT.Disconnect', 'v1', null, {
          reason: mqttReasonCodeNameEnum[reasonCode],
          reasonCode,
        })
      }

      // ignore 131 (MQTT broker limits)
      if (reasonCode === 131) {
        return
      }

      this.disconnect()

      // reconnect only on KEEP_ALIVE_TIMEOUT
      if (reasonCode === 141) {
        this.reconnect()
      } else {
        // onCloseHandler && onCloseHandler(mqttReasonCodeNameEnum[packet.reasonCode])
        // this.client.emit('disconnect', { reason: mqttReasonCodeNameEnum[packet.reasonCode] })
      }
    }
  }

  handleReconnectEvent() {
    this.reconnectCount += 1
  }

  connect(options) {
    return this.tokenProvider.getToken().then((password) => {
      super.connect({ ...options, password })

      this.bindEventListeners()

      return new Promise((resolve, reject) => {
        const connectHandler = () => {
          // eslint-disable-next-line no-use-before-define
          offHandlers()
          resolve()
        }
        const errorHandler = (error) => {
          // eslint-disable-next-line no-use-before-define
          offHandlers()
          reject(error)
        }
        const offHandlers = () => {
          super.off(ReconnectingMQTTClient.events.CONNECT, connectHandler)
          super.off(ReconnectingMQTTClient.events.ERROR, errorHandler)
        }

        super.on(ReconnectingMQTTClient.events.CONNECT, connectHandler)
        super.on(ReconnectingMQTTClient.events.ERROR, errorHandler)
      })
    })
  }

  disconnect() {
    this.forcedClose = true
    this.reconnectCount = 0

    this.backoff.reset()

    super.disconnect(true)
  }

  async reconnect() {
    if (this.tokenProviderPromise !== undefined) return

    this.forcedClose = false

    if (this.reconnectCount !== 0) {
      await sleep(this.backoff.value)

      this.backoff.next()
    }

    this.tokenProviderPromise = this.tokenProvider
      .getToken()
      .then((password) => {
        this.tokenProviderPromise = undefined

        this.client.options.password = password

        super.reconnect()
      })
      .catch(() => {
        this.tokenProviderPromise = undefined

        this.disconnect()
      })
  }

  /**
   * Set event tracker
   * @param {function} trackEvent
   */
  setEventTracker(trackEvent) {
    this.trackEvent = trackEvent
  }
}

export { MQTTClient, ReconnectingMQTTClient, defaultOptions }
