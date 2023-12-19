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
      EVENT_CREATE: 'event.create', // eslint-disable-line sonarjs/no-duplicate-string
      ROOM_CLOSE: 'room.close',
      ROOM_ENTER: 'room.enter',
      ROOM_LEAVE: 'room.leave',
      ROOM_UPDATE: 'room.update',
    }
  }

  constructor(mqttClient, agentId) {
    super(mqttClient, agentId, 'event.svc.netology-group.services')
  }
}

export default Event
