import Service from './service'

class Event extends Service {
  /**
   * Change type enum
   * @returns {{ADDITION: string, MODIFICATION: string, REMOVAL: string}}
   */
  static get changeTypes() {
    return {
      ADDITION: 'addition',
      MODIFICATION: 'modification',
      REMOVAL: 'removal',
    }
  }

  /**
   * Events enum
   * @returns {{AGENT_UPDATE: string, EVENT_CREATE: string, ROOM_CLOSE: string, ROOM_ENTER: string, ROOM_LEAVE: string, ROOM_UPDATE: string}}
   */
  static get events() {
    return {
      AGENT_UPDATE: 'agent.update',
      EVENT_BROADCAST: 'event.broadcast',
      EVENT_CREATE: 'event.create',
      ROOM_CLOSE: 'room.close',
      ROOM_ENTER: 'room.enter',
      ROOM_LEAVE: 'room.leave',
      ROOM_UPDATE: 'room.update',
    }
  }

  /**
   * Create room
   * @param {String} audience
   * @param {[Number, Number]} time
   * @param {Object} tags
   * @returns {Promise}
   */
  createRoom(audience, time, tags) {
    const parameters = {
      audience,
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
   * @param {Object} updateParameters
   * @returns {Promise}
   */
  updateRoom(id, updateParameters) {
    const { tags, time } = updateParameters
    const parameters = { id, tags, time }

    return this.rpc.send('room.update', parameters)
  }

  /**
   * List of event types that a user without room update rights cannot create (expected to be used for locked chats)
   * @param id
   * @param {Object} lockedTypes
   * @returns {Promise}
   */
  updateLockTypes(id, lockedTypes) {
    const parameters = { id, locked_types: lockedTypes }

    return this.rpc.send('room.locked_types', parameters)
  }

  /**
   * Enter room
   * @param id
   * @param broadcastSubscription
   * @returns {Promise}
   */
  enterRoom(id, broadcastSubscription = true) {
    const parameters = { id, broadcast_subscription: broadcastSubscription }

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
   * List agents in room
   * @param {uuid} roomId
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
   * Update agent in room (currently only ban or un-ban)
   * @param {uuid} roomId
   * @param accountId
   * @param {Boolean} value
   * @param {String} reason
   * @returns {Promise}
   */
  updateAgent(roomId, accountId, value, reason) {
    const parameters = {
      account_id: accountId,
      room_id: roomId,
      reason,
      value,
    }

    return this.rpc.send('agent.update', parameters)
  }

  /**
   * List bans in room
   * @param {uuid} roomId
   * @returns {Promise}
   */
  listBans(roomId) {
    const parameters = { room_id: roomId }

    return this.rpc.send('ban.list', parameters)
  }

  /**
   * Create event
   * @param {uuid} roomId
   * @param {String} type
   * @param {Object|String|Number} data
   * @param {Object} eventParameters event parameters: attribute, is_claim, is_persistent, label, set, removed
   * for more information see: https://github.com/foxford/event/blob/master/docs/src/api/event/create.md
   *
   * @returns {Promise}
   */
  createEvent(roomId, type, data, eventParameters = {}) {
    const parameters = {
      ...eventParameters,
      data,
      room_id: roomId,
      type,
    }

    return this.rpc.send('event.create', parameters)
  }

  /**
   * List events
   * @param {uuid} roomId
   * @param {Object} filterParameters Parameters to filter: attribute, direction, label, last_occurred_at, limit, set, type
   * @returns {Promise}
   */
  listEvent(roomId, filterParameters = {}) {
    const parameters = {
      ...filterParameters,
      room_id: roomId,
    }

    return this.rpc.send('event.list', parameters)
  }

  /**
   * Read state
   * @param {uuid} roomId
   * @param {String[]} sets
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  readState(roomId, sets, filterParameters = {}) {
    // eslint-disable-next-line camelcase
    const { attribute, limit, occurred_at, original_occurred_at } =
      filterParameters
    const parameters = {
      attribute,
      limit,
      occurred_at, // eslint-disable-line camelcase
      original_occurred_at, // eslint-disable-line camelcase
      room_id: roomId,
      sets,
    }

    return this.rpc.send('state.read', parameters)
  }

  /**
   * Create edition
   * @param {uuid} roomId
   * @returns {Promise}
   */
  createEdition(roomId) {
    const parameters = {
      room_id: roomId,
    }

    return this.rpc.send('edition.create', parameters)
  }

  /**
   * List editions
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEdition(roomId, filterParameters = {}) {
    const { last_created_at, limit } = filterParameters // eslint-disable-line camelcase
    const parameters = {
      last_created_at, // eslint-disable-line camelcase
      limit,
      room_id: roomId,
    }

    return this.rpc.send('edition.list', parameters)
  }

  /**
   * Delete edition
   * @param id
   * @returns {Promise}
   */
  deleteEdition(id) {
    const parameters = {
      id,
    }

    return this.rpc.send('edition.delete', parameters)
  }

  /**
   * Commit edition
   * @param id
   * @returns {Promise}
   */
  commitEdition(id) {
    const parameters = {
      id,
    }

    return this.rpc.send('edition.commit', parameters)
  }

  /**
   * Create change
   * @param editionId
   * @param type
   * @param event
   * @returns {Promise}
   */
  createChange(editionId, type, event) {
    const parameters = {
      edition_id: editionId,
      event,
      type,
    }

    return this.rpc.send('change.create', parameters)
  }

  /**
   * List changes
   * @param id
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listChange(id, filterParameters = {}) {
    const { last_created_at, limit } = filterParameters // eslint-disable-line camelcase
    const parameters = {
      id,
      last_created_at, // eslint-disable-line camelcase
      limit,
    }

    return this.rpc.send('change.list', parameters)
  }

  /**
   * Delete change
   * @param id
   * @returns {Promise}
   */
  deleteChange(id) {
    const parameters = { id }

    return this.rpc.send('change.delete', parameters)
  }

  /**
   * Send broadcast message
   * @param {uuid} roomId
   * @param {Object} data
   * @returns {Promise}
   */
  sendBroadcastMessage(roomId, data) {
    const parameters = data
    const topic = this.topicBroadcastFn(roomId)

    return this.rpc.broadcast(topic, 'event.broadcast', parameters)
  }
}

export default Event
