/* eslint-disable unicorn/prevent-abbreviations */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import Codec from './codec'

class Service {
  constructor(mqttClient, agentId, appName) {
    this.agentId = agentId
    this.appName = appName
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

    this.attachRoutes()
  }

  attachRoutes() {
    this.mqtt.attachRoute(
      this.topicPatternNotifications,
      this.subMessageHandler.bind(this)
    )
  }

  detachRoutes() {
    this.mqtt.detachRoute(this.topicPatternNotifications)
  }

  on(eventName, eventHandler) {
    this.ee.addListener(eventName, eventHandler)
  }

  off(eventName, eventHandler) {
    this.ee.removeListener(eventName, eventHandler)
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
  }
}

export default Service
