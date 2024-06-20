import BasicClient from './basic-client'

const eventEndpoints = {
  agentsList: (id) => `/event_rooms/${id}/agents`,
  agentsUpdate: (id) => `/event_rooms/${id}/agents`,
  banList: (id) => `/event_rooms/${id}/bans`,
  changesCreate: (id) => `/editions/${id}/changes`,
  changesDelete: (id) => `/changes/${id}`,
  changesList: (id) => `/editions/${id}/changes`,
  editionsCommit: (id) => `/editions/${id}/commit`,
  editionsCreate: (id) => `/event_rooms/${id}/editions`,
  editionsDelete: (id) => `/editions/${id}`,
  editionsList: (id) => `/event_rooms/${id}/editions`,
  eventsCreate: (id) => `/event_rooms/${id}/events`,
  eventsList: (id) => `/event_rooms/${id}/events`,
  eventsRemove: (id) => `/event_rooms/${id}/events`,
  roomEnter: (id) => `/event_rooms/${id}/enter`,
  roomRead: (id) => `/event_rooms/${id}`,
  roomState: (id) => `/event_rooms/${id}/state`,
  roomUpdate: (id) => `/event_rooms/${id}`,
  roomUpdateLockedTypes: (id) => `/event_rooms/${id}/locked_types`,
  roomUpdateWhiteboardAccess: (id) => `/event_rooms/${id}/whiteboard_access`,
}

class HTTPEvent extends BasicClient {
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
   * @deprecated
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
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listAgent(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.agentsList(roomId), filterParameters),
    )
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
      reason,
      value,
    }

    return this.patch(this.url(eventEndpoints.agentsUpdate(roomId)), parameters)
  }

  /**
   * List bans in room
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listBans(roomId, filterParameters = {}) {
    return this.get(this.url(eventEndpoints.banList(roomId), filterParameters))
  }

  /**
   * Create event
   * @deprecated
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
      type,
    }

    return this.post(this.url(eventEndpoints.eventsCreate(roomId)), parameters)
  }

  /**
   * Sets the flag "removed" for the event
   * @deprecated
   * @param {uuid} roomId
   * @param {String} type
   * @param {Object|String|Number} data
   * @param {Object} eventParameters event parameters: attribute, is_claim, is_persistent, label, set, removed
   * for more information see: https://github.com/foxford/event/blob/master/docs/src/api/event/create.md
   *
   * @returns {Promise}
   */
  createRemovalEvent(roomId, type, data, eventParameters = {}) {
    return this.createEvent(roomId, type, data, {
      ...eventParameters,
      removed: true,
    })
  }

  /**
   * List events
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEvent(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.eventsList(roomId), filterParameters),
    )
  }

  /**
   * Update locked types in room
   * @param {uuid} roomId
   * @param {Object} lockedTypes
   * @returns {Promise}
   */
  updateLockedTypes(roomId, lockedTypes) {
    return this.post(this.url(eventEndpoints.roomUpdateLockedTypes(roomId)), {
      locked_types: lockedTypes,
    })
  }

  /**
   * Use to update whiteboard access in a room
   * @param {uuid} roomId
   * @param {{ [account_id]: Boolean }} payload
   * @returns {Promise}
   */
  updateWhiteboardAccess(roomId, payload) {
    return this.post(
      this.url(eventEndpoints.roomUpdateWhiteboardAccess(roomId)),
      {
        whiteboard_access: payload,
      },
    )
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
      sets,
    }

    return this.get(this.url(eventEndpoints.roomState(roomId), parameters))
  }

  /**
   * Create edition
   * @param {uuid} roomId
   * @returns {Promise}
   */
  createEdition(roomId) {
    return this.post(this.url(eventEndpoints.editionsCreate(roomId)))
  }

  /**
   * List editions
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEdition(roomId, filterParameters = {}) {
    return this.get(
      this.url(eventEndpoints.editionsList(roomId), filterParameters),
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
    return this.post(this.url(eventEndpoints.editionsCommit(id)), {})
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
      parameters,
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
