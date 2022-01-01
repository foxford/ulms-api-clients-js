import BasicClient from './basic-client'

export const eventEndpoints = {
  agentsList: (id) => `/rooms/${id}/agents`,
  agentsUpdate: (id) => `/rooms/${id}/agents`,
  banList: (id) => `/rooms/${id}/bans`,
  changesCreate: (id) => `/editions/${id}/changes`,
  changesDelete: (id) => `/changes/${id}`,
  changesList: (id) => `/editions/${id}/changes`,
  editionsCommit: (id) => `/editions/${id}/commit`,
  editionsCreate: (id) => `/rooms/${id}/editions`,
  editionsDelete: (id) => `/editions/${id}`,
  editionsList: (id) => `/rooms/${id}/editions`,
  eventsCreate: (id) => `/rooms/${id}/events`,
  eventsList: (id) => `/rooms/${id}/events`,
  roomEnter: (id) => `/rooms/${id}/enter`,
  roomRead: (id) => `/rooms/${id}`,
  roomState: (id) => `/rooms/${id}/state`,
  roomUpdate: (id) => `/rooms/${id}`,
  roomUpdateLockedTypes: (id) => `/rooms/${id}/locked_types`,
}

class HTTPEvent extends BasicClient {
  /**
   * Read room
   * @param id
   * @returns {Promise}
   */
  readRoom(id) {
    return this.get(this.url(eventEndpoints.roomRead(id)))
  }

  /**
   * Update room
   * @param id
   * @param {Object} updateParameters
   * @returns {Promise}
   */
  updateRoom(id, updateParameters) {
    return this.patch(this.url(eventEndpoints.roomUpdate(id)), updateParameters)
  }

  /**
   * Enter room
   * @param id
   * @param {String} agentLabel
   * @param {Boolean} broadcastSubscription
   * @returns {Promise}
   */
  enterRoom(id, agentLabel, broadcastSubscription = true) {
    return this.post(this.url(eventEndpoints.roomEnter(id)), {
      agent_label: agentLabel,
      broadcast_subscription: broadcastSubscription,
    })
  }

  /**
   * List agents in room
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listAgent(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.agentsList(roomId), filterParameters)
    )
  }

  /**
   * Update agent in room (currently only ban or un-ban)
   * @param roomId
   * @param accountId
   * @param {Boolean} value
   * @param {String} reason
   * @returns {Promise}
   */
  updateAgent(roomId, accountId, value, reason) {
    const parameters = {
      account_id: accountId,
      reason,
      value,
    }

    return this.patch(this.url(eventEndpoints.agentsUpdate(roomId)), parameters)
  }

  /**
   * List bans in room
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listBans(roomId, filterParameters = {}) {
    return this.get(this.url(eventEndpoints.banList(roomId), filterParameters))
  }

  /**
   * Create event
   * @param roomId
   * @param {String} type
   * @param {Object|String|Number} data
   * @param {Object} eventParameters
   * @returns {Promise}
   */
  createEvent(roomId, type, data, eventParameters = {}) {
    const { attribute, is_claim, is_persistent, label, set } = eventParameters // eslint-disable-line camelcase
    const parameters = {
      attribute,
      data,
      is_claim, // eslint-disable-line camelcase
      is_persistent, // eslint-disable-line camelcase
      label,
      set,
      type,
    }

    return this.post(this.url(eventEndpoints.eventsCreate(roomId)), parameters)
  }

  /**
   * List events
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEvent(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.eventsList(roomId), filterParameters)
    )
  }

  /**
   * Update locked types in room
   * @param roomId
   * @param {Object} lockedTypes
   * @returns {Promise}
   */
  updateLockedTypes(roomId, lockedTypes) {
    return this.post(this.url(eventEndpoints.roomUpdateLockedTypes(roomId)), {
      locked_types: lockedTypes,
    })
  }

  /**
   * Read state
   * @param roomId
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
      sets,
    }

    return this.get(this.url(eventEndpoints.roomState(roomId), parameters))
  }

  /**
   * Create edition
   * @param roomId
   * @returns {Promise}
   */
  createEdition(roomId) {
    return this.post(this.url(eventEndpoints.editionsCreate(roomId)))
  }

  /**
   * List editions
   * @param roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEdition(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.editionsList(roomId), filterParameters)
    )
  }

  /**
   * Delete edition
   * @param id
   * @returns {Promise}
   */
  deleteEdition(id) {
    return this.delete(this.url(eventEndpoints.editionsDelete(id)))
  }

  /**
   * Commit edition
   * @param id
   * @returns {Promise}
   */
  commitEdition(id) {
    return this.post(this.url(eventEndpoints.editionsCommit(id)))
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
      event,
      type,
    }

    return this.post(
      this.url(eventEndpoints.changesCreate(editionId)),
      parameters
    )
  }

  /**
   * List changes
   * @param id
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listChange(id, filterParameters = {}) {
    return this.get(this.url(eventEndpoints.changesList(id), filterParameters))
  }

  /**
   * Delete change
   * @param id
   * @returns {Promise}
   */
  deleteChange(id) {
    return this.delete(this.url(eventEndpoints.changesDelete(id)))
  }
}

export default HTTPEvent
