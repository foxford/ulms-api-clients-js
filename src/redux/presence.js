// action types
const PRESENCE_CONNECT = 'presence/connect'
const PRESENCE_DISCONNECT = 'presence/disconnect'
const PRESENCE_UPDATE = 'presence/update'

// connection status enum
const presenceStatusEnum = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  IDLE: 'idle',
  PENDING: 'pending',
}

// selectors
const selectPresenceError = (state) => state.presence.error
const selectPresenceStatus = (state) => state.presence.status

const presenceInitialState = {
  error: undefined,
  status: presenceStatusEnum.IDLE,
}

export {
  PRESENCE_CONNECT,
  PRESENCE_DISCONNECT,
  PRESENCE_UPDATE,
  presenceInitialState,
  presenceStatusEnum,
  selectPresenceError,
  selectPresenceStatus,
}
