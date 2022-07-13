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
   * @returns {Promise}
   */
  readScope(kind, audience, scope) {
    return this.get(`${this.baseUrl}/audiences/${audience}/${kind}/${scope}`)
  }

  /**
   * Read class property
   * @param {string} kind
   * @param {string} classId
   * @param {string} propertyId
   * @returns {Promise}
   */
  readClassProperty(kind, classId, propertyId) {
    return this.get(`${this.baseUrl}/${kind}/${classId}/properties/${propertyId}`)
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
    return this.put(`${this.baseUrl}/${kind}/${classId}/properties/${propertyId}`, data)
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
    return this.post(`${this.baseUrl}/${kind}/${classId}/timestamps`, {
      position,
    })
  }
}

export default Dispatcher
