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

class Conference extends Service {
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
   * Create room
   * @param {String} audience
   * @param {[Number, Number]} time
   * @param {String} backend
   * @param {Number} reserve
   * @param {Object} tags
   * @returns {Promise}
   */
  createRoom(audience, time, backend, reserve, tags) {
    const parameters = {
      audience,
      backend,
      reserve,
      tags,
      time,
    }

    return this.rpc.send('room.create', parameters)
  }

  /**
   * Read room
   * @param id
   * @returns {Promise}
   */
  readRoom(id) {
    const parameters = { id }

    return this.rpc.send('room.read', parameters)
  }

  /**
   * Update room
   * @param id
   * @param {String} audience
   * @param {[Number, Number]} time
   * @returns {Promise}
   */
  updateRoom(id, audience, time) {
    const parameters = {
      audience,
      id,
      time,
    }

    return this.rpc.send('room.update', parameters)
  }

  /**
   * Close room
   * @param id
   * @returns {Promise}
   */
  closeRoom(id) {
    const parameters = { id }

    return this.rpc.send('room.close', parameters)
  }

  /**
   * Delete room
   * @param id
   * @returns {Promise}
   */
  deleteRoom(id) {
    const parameters = { id }

    return this.rpc.send('room.delete', parameters)
  }

  /**
   * Enter room
   * @param id
   * @returns {Promise}
   */
  enterRoom(id) {
    const parameters = { id }

    return this.rpc.send('room.enter', parameters)
  }

  /**
   * Leave room
   * @param id
   * @returns {Promise}
   */
  leaveRoom(id) {
    const parameters = { id }

    return this.rpc.send('room.leave', parameters)
  }

  /**
   * List agent
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listAgent(roomId, filterParameters = {}) {
    const { limit, offset } = filterParameters
    const parameters = {
      limit,
      offset,
      room_id: roomId,
    }

    return this.rpc.send('agent.list', parameters)
  }

  /**
   * Create RTC
   * @param roomId
   * @returns {Promise}
   */
  createRtc(roomId) {
    const parameters = { room_id: roomId }

    return this.rpc.send('rtc.create', parameters)
  }

  /**
   * Read RTC
   * @param id
   * @returns {Promise}
   */
  readRtc(id) {
    const parameters = { id }

    return this.rpc.send('rtc.read', parameters)
  }

  /**
   * List RTC
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listRtc(roomId, filterParameters = {}) {
    const { limit, offset } = filterParameters
    const parameters = {
      limit,
      offset,
      room_id: roomId,
    }

    return this.rpc.send('rtc.list', parameters)
  }

  /**
   * Connect to RTC
   * @param {String} id
   * @param {Object} optionParameters
   * @param {string} optionParameters.intent - Intent to connect to RTC ('read' or 'write')
   * @returns {Promise}
   */
  connectRtc(id, optionParameters = {}) {
    const { intent = Conference.intents.INTENT_READ } = optionParameters
    const parameters = {
      id,
      intent,
    }

    return this.rpc.send('rtc.connect', parameters)
  }

  /**
   * List RTC stream
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listRtcStream(roomId, filterParameters = {}) {
    const { limit, offset, rtc_id, time } = filterParameters // eslint-disable-line camelcase
    const parameters = {
      limit,
      offset,
      room_id: roomId,
      rtc_id, // eslint-disable-line camelcase
      time,
    }

    return this.rpc.send('rtc_stream.list', parameters)
  }

  /**
   * Create RTC signal
   * @param {String} handleId
   * @param {Object|Object[]} jsep
   * @param {String} label
   * @returns {Promise}
   */
  createRtcSignal(handleId, jsep, label) {
    const parameters = {
      jsep,
      handle_id: handleId,
      label,
    }

    return this.rpc.send('rtc_signal.create', parameters)
  }

  /**
   * Send broadcast message
   * @deprecated
   * @param roomId
   * @param {Object} data
   * @param {String} label
   * @returns {Promise}
   */
  sendBroadcastMessage(roomId, data, label) {
    const parameters = {
      data,
      label,
      room_id: roomId,
    }

    return this.rpc.send('message.broadcast', parameters)
  }

  /**
   * Send unicast message
   * @param roomId
   * @param agentId
   * @param {Object} data
   * @returns {Promise}
   */
  sendUnicastMessage(roomId, agentId, data) {
    const parameters = {
      agent_id: agentId,
      data,
      room_id: roomId,
    }

    return this.rpc.send('message.unicast', parameters)
  }

  /**
   * Read AgentReaderConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentReaderConfig(roomId) {
    const parameters = { room_id: roomId }

    return this.rpc.send('agent_reader_config.read', parameters)
  }

  /**
   * Read AgentWriterConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentWriterConfig(roomId) {
    const parameters = { room_id: roomId }

    return this.rpc.send('agent_writer_config.read', parameters)
  }

  /**
   * Update AgentReaderConfig
   * @param roomId
   * @param {AgentReaderConfig[]} configs
   * @returns {Promise}
   */
  updateAgentReaderConfig(roomId, configs) {
    const parameters = { configs, room_id: roomId }

    return this.rpc.send('agent_reader_config.update', parameters)
  }

  /**
   * Update AgentWriterConfig
   * @param roomId
   * @param {AgentWriterConfig[]} configs
   * @returns {Promise}
   */
  updateAgentWriterConfig(roomId, configs) {
    const parameters = { configs, room_id: roomId }

    return this.rpc.send('agent_writer_config.update', parameters)
  }
}

export default Conference
