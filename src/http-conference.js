import BasicClient from './basic-client'

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
 * Default parameters to filter listing requests
 * @name DefaultFilterParameters
 * @type {object}
 * @property {number} limit
 * @property {number} offset
 */

/**
 * Extended parameters to filter listing requests of rtc streams
 * @name RtcStreamFilterParameters
 * @type {object}
 * @extends DefaultFilterParameters
 * @property {string} rtc_id
 * @property {[number | null, number | null]} time
 */

class HTTPConference extends BasicClient {
  /**
   * Conference events enum
   * @returns {{
   *  AGENT_WRITER_CONFIG_UPDATE: string,
   *  ROOM_CLOSE: string,
   *  ROOM_ENTER: string,
   *  ROOM_LEAVE: string,
   *  ROOM_OPEN: string,
   *  RTC_STREAM_AGENT_SPEAKING: string
   *  RTC_STREAM_UPDATE: string
   * }}
   */
  static get events() {
    return {
      AGENT_WRITER_CONFIG_UPDATE: 'agent_writer_config.update',
      ROOM_CLOSE: 'room.close',
      ROOM_ENTER: 'room.enter',
      ROOM_LEAVE: 'room.leave',
      ROOM_OPEN: 'room.open',
      RTC_STREAM_AGENT_SPEAKING: 'rtc_stream.agent_speaking',
      RTC_STREAM_UPDATE: 'rtc_stream.update',
    }
  }

  /**
   * Conference intents enum
   * @returns {{INTENT_READ: string, INTENT_WRITE: string}}
   */
  static get intents() {
    return {
      INTENT_READ: 'read',
      INTENT_WRITE: 'write',
    }
  }

  /**
   * Read room
   * @param roomId
   * @returns {Promise}
   */
  readRoom(roomId) {
    return this.get(this.url(`/rooms/${roomId}`))
  }

  /**
   * Update room
   * @param roomId
   * @param {String} audience
   * @param {[Number, Number]} time
   * @returns {Promise}
   */
  updateRoom(roomId, audience, time) {
    const payload = {
      audience,
      time,
    }

    return this.patch(this.url(`/rooms/${roomId}`), payload)
  }

  /**
   * Close room
   * @param roomId
   * @returns {Promise}
   */
  closeRoom(roomId) {
    return this.post(this.url(`/rooms/${roomId}/close`))
  }

  /**
   * Enter room
   * @param roomId
   * @returns {Promise}
   */
  enterRoom(roomId) {
    return this.post(this.url(`/rooms/${roomId}/enter`))
  }

  /**
   * List agent
   * @param roomId
   * @param {DefaultFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  listAgent(roomId, filterParameters = {}) {
    return this.get(this.url(`/rooms/${roomId}/agents`, filterParameters))
  }

  /**
   * Create RTC
   * @param roomId
   * @returns {Promise}
   */
  createRtc(roomId) {
    return this.post(this.url(`/rooms/${roomId}/rtcs`))
  }

  /**
   * Read RTC
   * @param rtcId
   * @returns {Promise}
   */
  readRtc(rtcId) {
    return this.get(this.url(`/rtcs/${rtcId}`))
  }

  /**
   * List RTC
   * @param roomId
   * @param {DefaultFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  listRtc(roomId, filterParameters = {}) {
    return this.get(this.url(`/rooms/${roomId}/rtcs`, filterParameters))
  }

  /**
   * Connect to RTC
   * @param {String} rtcId
   * @param {Object} optionParameters
   * @param {String} optionParameters.intent - Intent to connect to RTC ('read' or 'write')
   * @returns {Promise}
   */
  connectRtc(rtcId, optionParameters = {}) {
    const { intent = HTTPConference.intents.INTENT_READ } = optionParameters
    const payload = {
      intent,
    }

    return this.post(this.url(`/rtcs/${rtcId}/streams`), payload)
  }

  /**
   * List RTC stream
   * @param roomId
   * @param {RtcStreamFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  listRtcStream(roomId, filterParameters = {}) {
    return this.get(this.url(`/rooms/${roomId}/streams`, filterParameters))
  }

  /**
   * Create RTC signal
   * @param {String} handleId
   * @param {Object|Object[]} jsep
   * @param {String} label
   * @returns {Promise}
   */
  createRtcSignal(handleId, jsep, label) {
    const payload = {
      jsep,
      handle_id: handleId,
      label,
    }

    return this.post(this.url('/streams/signal'), payload)
  }

  /**
   * Create signal
   * @param {String} rtcId
   * @param {Object|Object[]} jsep
   * @param {String} intent
   * @param {String} label
   * @returns {Promise}
   */
  createSignal(
    rtcId,
    jsep,
    intent = HTTPConference.intents.INTENT_READ, // eslint-disable-line default-param-last
    label
  ) {
    const payload = {
      intent,
      jsep,
      label,
    }

    return this.post(this.url(`/rtcs/${rtcId}/signal`), payload)
  }

  /**
   * Create trickle signal
   * @param {String} handleId
   * @param {Object|Object[]} candidates
   * @returns {Promise}
   */
  createTrickleSignal(handleId, candidates) {
    const payload = {
      candidates,
      handle_id: handleId,
    }

    return this.post(this.url('/streams/trickle'), payload)
  }

  /**
   * Read AgentReaderConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentReaderConfig(roomId) {
    return this.get(this.url(`/rooms/${roomId}/configs/reader`))
  }

  /**
   * Read AgentWriterConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentWriterConfig(roomId) {
    return this.get(this.url(`/rooms/${roomId}/configs/writer`))
  }

  /**
   * Update AgentReaderConfig
   * @param roomId
   * @param {AgentReaderConfig[]} configs
   * @returns {Promise}
   */
  updateAgentReaderConfig(roomId, configs) {
    const payload = { configs }

    return this.post(this.url(`/rooms/${roomId}/configs/reader`), payload)
  }

  /**
   * Update AgentWriterConfig
   * @param roomId
   * @param {AgentWriterConfig[]} configs
   * @returns {Promise}
   */
  updateAgentWriterConfig(roomId, configs) {
    const payload = { configs }

    return this.post(this.url(`/rooms/${roomId}/configs/writer`), payload)
  }
}

export default HTTPConference
