import Service from './service'

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

/**
 * @deprecated Use Broker class instead of Conference class
 */
class Conference extends Service {
  /**
   * Conference events enum
   * @returns {{
   *  AGENT_WRITER_CONFIG_UPDATE: string,
   *  GROUP_UPDATE: string,
   *  ROOM_CLOSE: string,
   *  ROOM_ENTER: string,
   *  ROOM_LEAVE: string,
   *  RTC_STREAM_AGENT_SPEAKING: string
   *  RTC_STREAM_UPDATE: string
   * }}
   */
  static get events() {
    return {
      AGENT_WRITER_CONFIG_UPDATE: 'agent_writer_config.update',
      GROUP_UPDATE: 'video_group.update',
      ROOM_CLOSE: 'room.close',
      ROOM_ENTER: 'room.enter',
      ROOM_LEAVE: 'room.leave',
      RTC_STREAM_AGENT_SPEAKING: 'rtc_stream.agent_speaking',
      RTC_STREAM_UPDATE: 'rtc_stream.update',
    }
  }

  constructor(mqttClient, agentId) {
    super(mqttClient, agentId, 'conference.svc.netology-group.services')
  }
}

export default Conference
