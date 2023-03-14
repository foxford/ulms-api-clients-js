import BasicClient from './basic-client'

class Dispatcher extends BasicClient {
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
   * Commit edition by scope
   * @param {string} audience
   * @param {string} scope
   * @param {string} editionId
   * @returns {Promise}
   */
  commitEdition(audience, scope, editionId) {
    return this.post(
      `${this.baseUrl}/audiences/${audience}/classes/${scope}/editions/${editionId}`
    )
  }

  /**
   * Read dispatcher scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @param {object} options
   * @returns {Promise}
   */
  readScope(kind, audience, scope, options) {
    return this.get(
      this.url(`/audiences/${audience}/${kind}/${scope}`, options)
    )
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
      `${this.baseUrl}/${kind}/${classId}/properties/${propertyId}`
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
      data
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
   * Update dispatcher scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @param {object} data
   * @returns {Promise}
   */
  updateScope(kind, audience, scope, data) {
    return this.put(
      `${this.baseUrl}/audiences/${audience}/${kind}/${scope}`,
      data
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
      { signal }
    ).finally(() => {
      clearTimeout(timeoutId)
    })
  }
}

export default Dispatcher
