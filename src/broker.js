/* eslint-disable unicorn/prevent-abbreviations */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import Codec from './codec'

/**
 * Agent reader configuration
 * @name AgentReaderConfig
 * @type {object}
 * @property {string} agent_id
 * @property {boolean} receive_audio
 * @property {boolean} receive_video
 */

/**
 * Agent writer configuration
 * @name AgentWriterConfig
 * @type {object}
 * @property {string} agent_id
 * @property {boolean} send_audio
 * @property {boolean} send_video
 * @property {number} video_remb
 */

const entityEventsEnum = {
  AGENT_UPDATE: 'agent.update',
  AGENT_WRITER_CONFIG_UPDATE: 'agent_writer_config.update',
  CONFERENCE_ROOM_CLOSE: 'conference_room.close',
  CONFERENCE_ROOM_ENTER: 'conference_room.enter',
  CONFERENCE_ROOM_LEAVE: 'conference_room.leave',
  EVENT_CREATE: 'event.create',
  EVENT_ROOM_ENTER: 'event_room.enter',
  EVENT_ROOM_LEAVE: 'event_room.leave',
  EVENT_ROOM_UPDATE: 'event_room.update',
  GROUP_UPDATE: 'video_group.update',
  RTC_STREAM_AGENT_SPEAKING: 'rtc_stream.agent_speaking',
  RTC_STREAM_UPDATE: 'rtc_stream.update',
}

class Broker {
  /**
   * Entity events enum
   * @returns {{
   *  AGENT_UPDATE: string,
   *  AGENT_WRITER_CONFIG_UPDATE: string,
   *  CONFERENCE_ROOM_CLOSE: string,
   *  CONFERENCE_ROOM_ENTER: string,
   *  CONFERENCE_ROOM_LEAVE: string,
   *  EVENT_CREATE: string,
   *  EVENT_ROOM_ENTER: string,
   *  EVENT_ROOM_LEAVE: string,
   *  EVENT_ROOM_UPDATE: string,
   *  GROUP_UPDATE: string,
   *  RTC_STREAM_AGENT_SPEAKING: string,
   *  RTC_STREAM_UPDATE: string,
   * }}
   */
  static get events() {
    return entityEventsEnum
  }

  constructor(mqttClient) {
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
      },
    )
    // eslint-disable-next-line unicorn/prefer-event-target
    this.ee = new EventEmitter()

    this.bindListeners()
  }

  bindListeners() {
    this.mqtt.on(
      this.mqtt.constructor.events.MESSAGE,
      this.messageHandler.bind(this),
    )
  }

  messageHandler(topic, message, packet) {
    const payload = this.codec.decode(message)
    const {
      properties: {
        userProperties: { label, type },
      },
    } = packet

    if (type === 'event' && payload !== undefined) {
      const event = {
        type: label,
        data: payload,
      }

      this.ee.emit(label, event)
    }
  }

  on(eventName, eventHandler) {
    this.ee.addListener(eventName, eventHandler)
  }

  off(eventName, eventHandler) {
    this.ee.removeListener(eventName, eventHandler)
  }

  destroy() {
    this.ee.removeAllListeners()
  }
}

export default Broker
