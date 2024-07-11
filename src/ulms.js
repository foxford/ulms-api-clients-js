import BasicClient from './basic-client'

const eventEndpoints = {
  agentsList: (id) => `/event_rooms/${id}/agents`,
  agentsUpdate: (id) => `/event_rooms/${id}/agents`,
  banList: (id) => `/event_rooms/${id}/bans`,
  changesCreate: (id) => `/editions/${id}/changes`,
  changesDelete: (id) => `/changes/${id}`,
  changesList: (id) => `/editions/${id}/changes`,
  editionsCreate: (id) => `/event_rooms/${id}/editions`,
  editionsDelete: (id) => `/editions/${id}`,
  editionsList: (id) => `/event_rooms/${id}/editions`,
  eventsCreate: (id) => `/event_rooms/${id}/events`,
  eventsList: (id) => `/event_rooms/${id}/events`,
  roomRead: (id) => `/event_rooms/${id}`,
  roomState: (id) => `/event_rooms/${id}/state`,
  roomUpdateLockedTypes: (id) => `/event_rooms/${id}/locked_types`,
  roomUpdateWhiteboardAccess: (id) => `/event_rooms/${id}/whiteboard_access`,
}

class ULMS extends BasicClient {
  /**
   * Scope kind enum
   * @returns {{CHAT: string, MINIGROUP: string, P2P: string, WEBINAR: string}}
   */
  static get kind() {
    return {
      CHAT: 'chats',
      MINIGROUP: 'minigroups',
      P2P: 'p2p',
      WEBINAR: 'webinars',
    }
  }

  /**
   * Scope status enum
   * @returns {{REAL_TIME: string, CLOSED: string, FINISHED: string, ADJUSTED: string, TRANSCODED: string}}
   */
  static get scopeStatus() {
    return {
      REAL_TIME: 'real-time',
      CLOSED: 'closed',
      FINISHED: 'finished',
      ADJUSTED: 'adjusted',
      TRANSCODED: 'transcoded',
    }
  }

  /**
   * Class properties enum
   * @returns {{IS_ADULT: string, HAS_USER_ACCESS_TO_BOARD: string}}
   */
  static get classKeys() {
    return {
      IS_ADULT: 'is_adult',
      HAS_USER_ACCESS_TO_BOARD: 'has_user_access_to_board',
      TOXIC_COMMENT_CLASSIFIER_ENABLED: 'toxic_comment_classifier_enabled',
      EMOTIONS: 'emotions',
    }
  }

  /**
   * Account properties enum
   * @returns {{ONBOARDING: string}}
   */
  static get accountKeys() {
    return {
      LAST_SEEN_MESSAGE_ID_BY_ROOMS: 'last_seen_message_id_by_rooms',
      ONBOARDING: 'onboarding',
    }
  }

  /**
   * Bans media stream and collaboration for user
   * @param {{ accountId: string, ban: boolean, classId: string }}
   * @returns {Promise}
   */
  banUser({ accountId, ban, classId }) {
    return this.get(
      `${this.baseUrl}/account/${accountId}/ban/${classId}`, // get last ban operation id for user
      // eslint-disable-next-line camelcase
    ).then(({ last_seen_op_id }) =>
      this.post(`${this.baseUrl}/account/${accountId}/ban`, {
        ban,
        class_id: classId,
        // eslint-disable-next-line camelcase
        last_seen_op_id,
      }),
    )
  }

  /**
   * Close classroom
   * @param classroomId
   * @returns {Promise}
   */
  closeClassroom(classroomId) {
    return this.post(this.url(`/classrooms/${classroomId}/close`))
  }

  /**
   * Commit edition by scope
   * @param {string} audience
   * @param {string} scope
   * @param {string} editionId
   * @returns {Promise}
   */
  commitEdition(audience, scope, editionId) {
    return this.post(
      `${this.baseUrl}/audiences/${audience}/classes/${scope}/editions/${editionId}`,
    )
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
      type,
    }

    return this.post(this.url(eventEndpoints.eventsCreate(roomId)), parameters)
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
   * Sets the flag "removed" for the event
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
   * Delete edition
   * @param id
   * @returns {Promise}
   */
  deleteEdition(id) {
    return this.delete(this.url(eventEndpoints.editionsDelete(id)))
  }

  /**
   * Delete change
   * @param id
   * @returns {Promise}
   */
  deleteChange(id) {
    return this.delete(this.url(eventEndpoints.changesDelete(id)))
  }

  /**
   * Perform enter to classroom
   * @param {string} classroomId
   * @param {string} agentLabel
   * @returns {Promise}
   */
  enterClassroom(classroomId, agentLabel) {
    return this.post(`${this.baseUrl}/classrooms/${classroomId}/enter`, {
      agent_label: agentLabel,
    })
  }

  /**
   * Fetch token data for NATS
   * @param {string} classroomId
   * @returns {Promise}
   */
  fetchTokenData(classroomId) {
    return this.post(`${this.baseUrl}/classrooms/${classroomId}/tokens`)
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
   * List bans in room
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listBans(roomId, filterParameters = {}) {
    return this.get(this.url(eventEndpoints.banList(roomId), filterParameters))
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
   * Read event room
   * @param roomId
   * @returns {Promise}
   */
  readEventRoom(roomId) {
    return this.get(this.url(eventEndpoints.roomRead(roomId)))
  }

  /**
   * Read ulms scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @param {object} options
   * @returns {Promise}
   */
  readScope(kind, audience, scope, options) {
    return this.get(
      this.url(`/audiences/${audience}/${kind}/${scope}`, options),
      { timeout: 10_000, retry: true },
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
   * Read class property
   * @param {string} kind
   * @param {string} classId
   * @param {string} propertyId
   * @returns {Promise}
   */
  readClassProperty(kind, classId, propertyId) {
    return this.get(
      `${this.baseUrl}/${kind}/${classId}/properties/${propertyId}`,
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
   * Update class property
   * @param {string} kind
   * @param {string} classId
   * @param {string} propertyId
   * @param {object} data
   * @returns {Promise}
   */
  updateClassProperty(kind, classId, propertyId, data) {
    return this.put(
      `${this.baseUrl}/${kind}/${classId}/properties/${propertyId}`,
      data,
    )
  }

  /**
   * Read account property
   * @param {string} propertyId
   * @returns {Promise}
   */
  readAccountProperty(propertyId) {
    return this.get(`${this.baseUrl}/account/properties/${propertyId}`)
  }

  /**
   * Update account property
   * @param {string} propertyId
   * @param {object} data
   * @returns {Promise}
   */
  updateAccountProperty(propertyId, data) {
    return this.put(`${this.baseUrl}/account/properties/${propertyId}`, data)
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
   * Update ulms scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @param {object} data
   * @returns {Promise}
   */
  updateScope(kind, audience, scope, data) {
    return this.put(
      `${this.baseUrl}/audiences/${audience}/${kind}/${scope}`,
      data,
    )
  }

  /**
   * Update position timestamp
   * @param {string} kind
   * @param {string} classId
   * @param {number} position
   * @returns {Promise}
   */
  updatePosition(kind, classId, position) {
    const controller = new AbortController()
    const { signal } = controller
    const timeoutId = setTimeout(() => controller.abort(), 10 * 1000)

    return this.post(
      `${this.baseUrl}/${kind}/${classId}/timestamps`,
      { position },
      { signal },
    ).finally(() => {
      clearTimeout(timeoutId)
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
}

export default ULMS
