/* eslint-disable camelcase */
import { BasicClient } from './basic-client'

const eventEndpoints = {
  banList: id => `/rooms/${id}/bans`,
  roomRead: id => `/rooms/${id}`,
  roomUpdate: id => `/rooms/${id}`,
  roomEnter: id => `/rooms/${id}/enter`,
  roomState: id => `/rooms/${id}/state`,
  roomUpdateLockedTypes: id => `/rooms/${id}/locked_types`,
  eventsList: id => `/rooms/${id}/events`,
  eventsCreate: id => `/rooms/${id}/events`,
  agentsList: id => `/rooms/${id}/agents`,
  agentsUpdate: id => `/rooms/${id}/agents`,
  editionsList: id => `/rooms/${id}/editions`,
  editionsCreate: id => `/rooms/${id}/editions`,
  editionsDelete: id => `/editions/${id}`,
  editionsCommit: id => `/editions/${id}/commit`,
  changesList: id => `/editions/${id}/changes`,
  changesCreate: id => `/editions/${id}/changes`,
  changesDelete: id => `/changes/${id}`
}

class HTTPEvent extends BasicClient {
  /**
   * Read room
   * @param id
   * @returns {Promise}
   */
  readRoom (id) {
    return this._get(this._url(eventEndpoints.roomRead(id)))
  }

  /**
   * Update room
   * @param id
   * @param {Object} updateParams
   * @returns {Promise}
   */
  updateRoom (id, updateParams) {
    return this._patch(this._url(eventEndpoints.roomUpdate(id)), updateParams)
  }

  /**
   * Enter room
   * @param id
   * @param {String} agent_label
   * @param {Boolean} broadcast_subscription
   * @returns {Promise}
   */
  enterRoom (id, agent_label, broadcast_subscription = true) {
    return this._post(this._url(eventEndpoints.roomEnter(id)), { agent_label, broadcast_subscription })
  }

  /**
   * List agents in room
   * @param room_id
   * @param {Object} filterParams
   * @returns {Promise}
   */
  listAgent (room_id, filterParams = {}) {
    return this._get(this._url(eventEndpoints.agentsList(room_id), filterParams))
  }

  /**
   * Update agent in room (currently only ban or un-ban)
   * @param room_id
   * @param account_id
   * @param {Boolean} value
   * @param {String} reason
   * @returns {Promise}
   */
  updateAgent (room_id, account_id, value, reason) {
    const params = {
      account_id,
      reason,
      value
    }

    return this._patch(this._url(eventEndpoints.agentsUpdate(room_id)), params)
  }

  /**
   * List bans in room
   * @param room_id
   * @param {Object} filterParams
   * @returns {Promise}
   */
  listBans (room_id, filterParams = {}) {
    return this._get(this._url(eventEndpoints.banList(room_id), filterParams))
  }

  /**
   * Create event
   * @param room_id
   * @param {String} type
   * @param {Object|String|Number} data
   * @param {Object} eventParams
   * @returns {Promise}
   */
  createEvent (room_id, type, data, eventParams = {}) {
    const {
      attribute,
      is_claim,
      is_persistent,
      label,
      set
    } = eventParams
    const params = {
      attribute,
      data,
      is_claim,
      is_persistent,
      label,
      set,
      type
    }

    return this._post(this._url(eventEndpoints.eventsCreate(room_id)), params)
  }

  /**
   * List events
   * @param room_id
   * @param {Object} filterParams
   * @returns {Promise}
   */
  listEvent (room_id, filterParams = {}) {
    return this._get(this._url(eventEndpoints.eventsList(room_id), filterParams))
  }

  /**
   * Update locked types in room
   * @param room_id
   * @param {Object} locked_types
   * @returns {Promise}
   */
  updateLockedTypes (room_id, locked_types) {
    return this._post(this._url(eventEndpoints.roomUpdateLockedTypes(room_id)), { locked_types })
  }

  /**
   * Read state
   * @param room_id
   * @param {String[]} sets
   * @param {Object} filterParams
   * @returns {Promise}
   */
  readState (room_id, sets, filterParams = {}) {
    const {
      attribute,
      limit,
      occurred_at,
      original_occurred_at
    } = filterParams
    const params = {
      attribute,
      limit,
      occurred_at,
      original_occurred_at,
      sets
    }

    return this._get(this._url(eventEndpoints.roomState(room_id), params))
  }

  /**
   * Create edition
   * @param room_id
   * @returns {Promise}
   */
  createEdition (room_id) {
    return this._post(this._url(eventEndpoints.editionsCreate(room_id)))
  }

  /**
   * List editions
   * @param room_id
   * @param {Object} filterParams
   * @returns {Promise}
   */
  listEdition (room_id, filterParams = {}) {
    return this._get(this._url(eventEndpoints.editionsList(room_id), filterParams))
  }

  /**
   * Delete edition
   * @param id
   * @returns {Promise}
   */
  deleteEdition (id) {
    return this._delete(this._url(eventEndpoints.editionsDelete(id)))
  }

  /**
   * Commit edition
   * @param id
   * @returns {Promise}
   */
  commitEdition (id) {
    return this._post(this._url(eventEndpoints.editionsCommit(id)))
  }

  /**
   * Create change
   * @param edition_id
   * @param type
   * @param event
   * @returns {Promise}
   */
  createChange (edition_id, type, event) {
    const params = {
      event,
      type
    }

    return this._post(this._url(eventEndpoints.changesCreate(edition_id)), params)
  }

  /**
   * List changes
   * @param id
   * @param {Object} filterParams
   * @returns {Promise}
   */
  listChange (id, filterParams = {}) {
    return this._get(this._url(eventEndpoints.changesList(id), filterParams))
  }

  /**
   * Delete change
   * @param id
   * @returns {Promise}
   */
  deleteChange (id) {
    return this._delete(this._url(eventEndpoints.changesDelete(id)))
  }
}

export { HTTPEvent }
