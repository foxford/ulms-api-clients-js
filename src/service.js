/* eslint-disable unicorn/prevent-abbreviations */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import Codec from './codec'
import MQTTRPCService from './mqtt-rpc'

class Service {
  constructor(mqttClient, agentId, appName) {
    this.agentId = agentId
    this.appName = appName
    this.topicBroadcastFn = (roomId) =>
      `broadcasts/${this.appName}/api/v1/rooms/${roomId}/events`
    this.topicIn = `agents/${this.agentId}/api/v1/in/${this.appName}`
    this.topicOut = `agents/${this.agentId}/api/v1/out/${this.appName}`
    this.topicPatternBroadcasts = `broadcasts/${this.appName}/api/v1/rooms/+roomId/events`
    this.topicPatternNotifications = `apps/${this.appName}/api/v1/rooms/+roomId/events`
    this.mqtt = mqttClient

    this.codec = new Codec(
      (data) => JSON.stringify(data),
      (data) => {
        let payload

        try {
          payload = JSON.parse(data.toString())
        } catch {
          payload = {}
        }

        return payload
      }
    )
    this.ee = new EventEmitter()
    this.rpc = new MQTTRPCService(
      this.mqtt,
      this.topicIn,
      this.topicOut,
      this.codec,
      {}
    )

    this.attachRoutes()
  }

  attachRoutes() {
    this.mqtt.attachRoute(
      this.topicPatternBroadcasts,
      this.subMessageHandler.bind(this)
    )
    this.mqtt.attachRoute(
      this.topicPatternNotifications,
      this.subMessageHandler.bind(this)
    )
  }

  detachRoutes() {
    this.mqtt.detachRoute(this.topicPatternBroadcasts)
    this.mqtt.detachRoute(this.topicPatternNotifications)
  }

  register(...args) {
    this.rpc.register(...args)
  }

  unregister(...args) {
    this.rpc.unregister(...args)
  }

  on(eventName, eventHandler) {
    this.ee.addListener(eventName, eventHandler)
  }

  off(eventName, eventHandler) {
    this.ee.removeListener(eventName, eventHandler)
  }

  setLabels(labels) {
    this.rpc.setLabels(labels)
  }

  clearLabels() {
    this.rpc.clearLabels()
  }

  subMessageHandler(topicParams, topic, message, packet) {
    const payload = this.codec.decode(message)
    const { properties } = packet
    const {
      userProperties: { label, type },
    } = properties
    let event

    if (type === 'event' && payload !== undefined) {
      event = {
        type: label,
        data: payload,
      }

      this.ee.emit(event.type, event)
    } else {
      // do nothing
    }
  }

  destroy() {
    this.detachRoutes()
    this.ee.removeAllListeners()
    this.rpc.destroy()
  }
}

export default Service
