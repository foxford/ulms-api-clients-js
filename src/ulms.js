import BasicClient from './basic-client'

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
   * Close room
   * @param classroomId
   * @returns {Promise}
   */
  closeRoom(classroomId) {
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

    return this.post(`${this.baseUrl}/event_rooms/${roomId}/events`, parameters)
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
   * List events
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEvent(roomId, filterParameters = {}) {
    return this.get(this.url(`/event_rooms/${roomId}/events`, filterParameters))
  }

  /**
   * Read room
   * @param roomId
   * @returns {Promise}
   */
  readRoom(roomId) {
    return this.get(`${this.baseUrl}/event_rooms/${roomId}`)
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

    return this.get(this.url(`/event_rooms/${roomId}/state`, parameters))
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
    return this.post(this.url(`/event_rooms/${roomId}/locked_types`), {
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
    return this.post(this.url(`/event_rooms/${roomId}/whiteboard_access`), {
      whiteboard_access: payload,
    })
  }
}

export default ULMS
