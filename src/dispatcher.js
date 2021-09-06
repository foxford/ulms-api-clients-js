import { BasicClient } from './basic-client'

export class Dispatcher extends BasicClient {
  /**
   * Scope kind enum
   * @returns {{CHAT: string, MINIGROUP: string, P2P: string, WEBINAR: string}}
   */
  static get kind () {
    return {
      CHAT: 'chats',
      MINIGROUP: 'minigroups',
      P2P: 'p2p',
      WEBINAR: 'webinars'
    }
  }

  /**
   * Scope status enum
   * @returns {{REAL_TIME: string, CLOSED: string, FINISHED: string, ADJUSTED: string, TRANSCODED: string}}
   */
  static get scopeStatus () {
    return {
      REAL_TIME: 'real-time',
      CLOSED: 'closed',
      FINISHED: 'finished',
      ADJUSTED: 'adjusted',
      TRANSCODED: 'transcoded'
    }
  }

  /**
   * Read dispatcher scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @returns {Promise}
   */
  readScope (kind, audience, scope) {
    return this._get(`${this.endpoint}/audiences/${audience}/${kind}/${scope}`)
  }

  /**
   * Update dispatcher scope
   * @param {string} kind
   * @param {string} audience
   * @param {string} scope
   * @param {object} data
   * @returns {Promise}
   */
  updateScope (kind, audience, scope, data) {
    return this._put(`${this.endpoint}/audiences/${audience}/${kind}/${scope}`, data)
  }
}
