/* eslint-disable camelcase */
const AGENT_ENTITY_TYPE = 'agent'

const ENTERED = 'entered'
const LEFT = 'left'
const REQUEST = 'request'
const RESET = 'reset'
const UPDATE = 'update'

// agent entity operation enum
const agentEntityOperationEnum = {
  ENTERED,
  LEFT,
}

// action types
const AGENT_ENTERED = `${AGENT_ENTITY_TYPE}/${ENTERED}`
const AGENT_LEFT = `${AGENT_ENTITY_TYPE}/${LEFT}`
const AGENT_REQUEST = `${AGENT_ENTITY_TYPE}/${REQUEST}`
const AGENT_RESET = `${AGENT_ENTITY_TYPE}/${RESET}`
const AGENT_UPDATE = `${AGENT_ENTITY_TYPE}/${UPDATE}`

// state request status enum
const agentStatusEnum = {
  FAILED: 'failed',
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
}

// selectors
const selectAgentList = (state) =>
  Object.keys(state.agent.data).map((_) => _.split('.')[1])
const selectAgentNotificationBuffer = (state) => state.agent.buffer
const selectAgentStatus = (state) => state.agent.status
const selectOnlineAgentList = (state) =>
  Object.values(state.agent.data)
    .filter((_) => _.online)
    .map((_) => _.agent_id.split('.')[1])

const selectOnlineAgentListWithLabel = (state) =>
  Object.values(state.agent.data)
    .filter((_) => _.online)
    .map((_) => _.agent_id)

const agentInitialState = {
  buffer: [],
  data: {},
  error: undefined,
  status: agentStatusEnum.IDLE,
}

const agentOperationReducer = (state, payload) => {
  const { buffer, data, status } = state
  const {
    event_id: eventId,
    id,
    payload: { agent_id },
  } = payload
  const { operation, sequence_id } = eventId || id

  if (status !== agentStatusEnum.SUCCEEDED) {
    const transformedPayload = {
      ...payload,
      event_id: eventId || id,
    }

    return { ...state, buffer: [...buffer, transformedPayload] }
  }

  return {
    ...state,
    data: {
      ...data,
      [agent_id]: {
        agent_id,
        online: operation === agentEntityOperationEnum.ENTERED,
        sequence_id,
      },
    },
  }
}

export {
  AGENT_ENTERED,
  AGENT_ENTITY_TYPE,
  AGENT_LEFT,
  AGENT_REQUEST,
  AGENT_RESET,
  AGENT_UPDATE,
  agentEntityOperationEnum,
  agentInitialState,
  agentOperationReducer,
  agentStatusEnum,
  selectAgentList,
  selectAgentNotificationBuffer,
  selectAgentStatus,
  selectOnlineAgentList,
  selectOnlineAgentListWithLabel,
}
