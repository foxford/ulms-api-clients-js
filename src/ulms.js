import BasicClient from './basic-client'
import { UlmsError } from './error'

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

/**
 * Default parameters to filter listing requests
 * @name DefaultFilterParameters
 * @type {object}
 * @property {number} limit
 * @property {number} offset
 */

/**
 * Group configuration
 * @name GroupConfig
 * @type {object}
 * @property {number} number
 * @property {string[]} agents
 */

/**
 * Filter parameters for groups read requests
 * @name GroupsFilterParameters
 * @type {object}
 * @property {number} within_group
 */

/**
 * Extended parameters to filter listing requests of rtc streams
 * @name RtcStreamFilterParameters
 * @type {object}
 * @extends DefaultFilterParameters
 * @property {string} rtc_id
 * @property {[number | null, number | null]} time
 */

async function handleResponse(response) {
  let data

  try {
    data = await response.json()
  } catch (error) {
    throw new UlmsError(UlmsError.decodeErrorKinds.JSON_PARSE_ERROR, {
      cause: error,
    })
  }

  if (!response.ok) {
    const {
      // new error format
      kind = '',
      is_transient: isTransient = false,

      // old error format (ProblemDetail { type: string, title: string, detail: string })
      // todo: remove after migration to new error format
      type,
    } = data
    let errorPayload = {
      kind,
      isTransient,
    }

    // override error payload in case of old error format (or another format from portal or fvs, etc...)
    // todo: remove after migration to new error format
    if (type !== undefined) {
      errorPayload = {
        kind: type,
        isTransient,
      }
    }

    throw UlmsError.fromPayload(errorPayload)
  }

  return data
}

class ULMS extends BasicClient {
  agentLabel

  constructor(...arguments_) {
    super(...arguments_)

    this.handleResponse = handleResponse
  }

  setAgentLabel(label) {
    this.agentLabel = label
  }

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
      EMOTIONS: 'emotions',
      HAS_USER_ACCESS_TO_BOARD: 'has_user_access_to_board',
      IS_ADULT: 'is_adult',
      TOXIC_COMMENT_CLASSIFIER_ENABLED: 'toxic_comment_classifier_enabled',
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
    return this.post(`${this.baseUrl}/account/${accountId}/ban`, {
      ban,
      class_id: classId,
    })
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
    return this.post(this.url(`/event_rooms/${roomId}/editions`))
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
      agent_label: this.agentLabel,
      ...eventParameters,
      data,
      type,
    }

    return this.post(this.url(`/event_rooms/${roomId}/events`), parameters)
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

    return this.post(this.url(`/editions/${editionId}/changes`), parameters)
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
   * Create RTC
   * @param roomId
   * @returns {Promise}
   */
  createRtc(roomId) {
    return this.post(this.url(`/conference_rooms/${roomId}/rtcs`), {
      agent_label: this.agentLabel,
    })
  }

  /**
   * Create signal
   * @param {String} rtcId
   * @param {Object|Object[]} jsep
   * @param {String} intent
   * @param {String} label
   * @returns {Promise}
   */
  createSignal(
    rtcId,
    jsep,
    intent = ULMS.intents.INTENT_READ, // eslint-disable-line default-param-last
    label,
  ) {
    const payload = {
      agent_label: this.agentLabel,
      intent,
      jsep,
      label,
    }

    return this.post(this.url(`/conference_rtcs/${rtcId}/signal`), payload)
  }

  /**
   * Create trickle signal
   * @param {String} handleId
   * @param {Object|Object[]} candidates
   * @returns {Promise}
   */
  createTrickleSignal(handleId, candidates) {
    const payload = {
      agent_label: this.agentLabel,
      candidates,
      handle_id: handleId,
    }

    return this.post(this.url('/conference_streams/trickle'), payload)
  }

  /**
   * Delete edition
   * @param id
   * @returns {Promise}
   */
  deleteEdition(id) {
    return this.delete(this.url(`/editions/${id}`))
  }

  /**
   * Delete change
   * @param id
   * @returns {Promise}
   */
  deleteChange(id) {
    return this.delete(this.url(`/changes/${id}`))
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
   * List agents in event room
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listAgent(roomId, filterParameters = {}) {
    return this.get(this.url(`/event_rooms/${roomId}/agents`, filterParameters))
  }

  /**
   * List agents in conference room
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listAgentConferenceRoom(roomId, filterParameters = {}) {
    return this.get(
      this.url(`/conference_rooms/${roomId}/agents`, filterParameters),
    )
  }

  /**
   * List bans in room
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listBans(roomId, filterParameters = {}) {
    return this.get(this.url(`/event_rooms/${roomId}/bans`, filterParameters))
  }

  /**
   * List changes
   * @param id
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listChange(id, filterParameters = {}) {
    return this.get(this.url(`/editions/${id}/changes`, filterParameters))
  }

  /**
   * List editions
   * @param {uuid} roomId
   * @param {Object} filterParameters
   * @returns {Promise}
   */
  listEdition(roomId, filterParameters = {}) {
    return this.get(
      this.url(`/event_rooms/${roomId}/editions`, filterParameters),
    )
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
   * List RTC
   * @param roomId
   * @param {DefaultFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  listRtc(roomId, filterParameters = {}) {
    return this.get(
      this.url(`/conference_rooms/${roomId}/rtcs`, filterParameters),
    )
  }

  /**
   * List RTC stream
   * @param roomId
   * @param {RtcStreamFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  listRtcStream(roomId, filterParameters = {}) {
    return this.get(
      this.url(`/conference_rooms/${roomId}/streams`, filterParameters),
    )
  }

  /**
   * Read AgentReaderConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentReaderConfig(roomId) {
    return this.get(
      this.url(`/conference_rooms/${roomId}/configs/reader`, {
        agent_label: this.agentLabel,
      }),
    )
  }

  /**
   * Read AgentWriterConfig
   * @param roomId
   * @returns {Promise}
   */
  readAgentWriterConfig(roomId) {
    return this.get(
      this.url(`/conference_rooms/${roomId}/configs/writer`, {
        agent_label: this.agentLabel,
      }),
    )
  }

  /**
   * Read conference room
   * @param roomId
   * @returns {Promise}
   */
  readConferenceRoom(roomId) {
    return this.get(this.url(`/conference_rooms/${roomId}`))
  }

  /**
   * Read event room
   * @param roomId
   * @returns {Promise}
   */
  readEventRoom(roomId) {
    return this.get(this.url(`/event_rooms/${roomId}`))
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

    return this.patch(this.url(`/event_rooms/${roomId}/agents`), parameters)
  }

  /**
   * Update AgentReaderConfig
   * @param roomId
   * @param {AgentReaderConfig[]} configs
   * @returns {Promise}
   */
  updateAgentReaderConfig(roomId, configs) {
    const payload = {
      agent_label: this.agentLabel,
      configs,
    }

    return this.post(
      this.url(`/conference_rooms/${roomId}/configs/reader`),
      payload,
    )
  }

  /**
   * Update AgentWriterConfig
   * @param roomId
   * @param {AgentWriterConfig[]} configs
   * @returns {Promise}
   */
  updateAgentWriterConfig(roomId, configs) {
    const payload = {
      agent_label: this.agentLabel,
      configs,
    }

    return this.post(
      this.url(`/conference_rooms/${roomId}/configs/writer`),
      payload,
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
   * Read Groups
   * @param roomId
   * @param {GroupsFilterParameters|Object} filterParameters
   * @returns {Promise}
   */
  readGroups(roomId, filterParameters) {
    const parameters = {
      agent_label: this.agentLabel,
      ...filterParameters,
    }

    return this.get(this.url(`/conference_rooms/${roomId}/groups`, parameters))
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
   * Update Groups
   * @param roomId
   * @param {GroupConfig[]} groups
   * @returns {Promise}
   */
  updateGroups(roomId, groups) {
    const parameters = {
      agent_label: this.agentLabel,
      groups,
    }

    return this.post(this.url(`/conference_rooms/${roomId}/groups`), parameters)
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
