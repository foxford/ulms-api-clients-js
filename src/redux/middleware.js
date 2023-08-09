/* eslint-disable camelcase, no-await-in-loop, no-restricted-syntax, sonarjs/cognitive-complexity, unicorn/no-array-reduce */
import Debug from 'debug'

import Backoff from '../backoff'
import { sleep } from '../common'

import {
  AGENT_ENTERED,
  AGENT_ENTITY_TYPE,
  AGENT_LEFT,
  AGENT_REQUEST,
  AGENT_RESET,
  AGENT_UPDATE,
  agentEntityOperationEnum,
  agentStatusEnum,
  selectAgentNotificationBuffer,
  selectAgentStatus,
} from './agent'
import {
  PRESENCE_CONNECT,
  PRESENCE_DISCONNECT,
  PRESENCE_UPDATE,
  presenceStatusEnum,
  selectPresenceStatus,
} from './presence'

const debug = Debug('presence-mw')

const messageHandler = ({ dispatch }, message) => {
  const {
    id: { entity_type: entityType, operation },
  } = message

  debug('event', message)

  if (entityType === AGENT_ENTITY_TYPE) {
    switch (operation) {
      case agentEntityOperationEnum.ENTERED:
        dispatch({ type: AGENT_ENTERED, payload: message })

        break

      case agentEntityOperationEnum.LEFT:
        dispatch({ type: AGENT_LEFT, payload: message })

        break

      default:
      // do nothing
    }
  } else {
    dispatch({ type: `${entityType}/${operation}`, payload: message })
  }
}

async function startPresenceFlow(
  { dispatch },
  { presenceWs },
  classroomId,
  agentLabel = 'http'
) {
  try {
    debug('[flow] start')
    dispatch({
      type: PRESENCE_UPDATE,
      payload: { status: presenceStatusEnum.PENDING },
    })

    await presenceWs.connect({
      agentLabel,
      classroomId,
    })

    debug('[flow] connected')
    dispatch({
      type: PRESENCE_UPDATE,
      payload: { status: presenceStatusEnum.CONNECTED },
    })

    const reason = await presenceWs.disconnected()

    debug('[flow] disconnected, reason:', reason)
    dispatch({
      type: PRESENCE_UPDATE,
      payload: { status: presenceStatusEnum.DISCONNECTED, error: reason },
    })
  } catch (error) {
    debug('[flow] catch', error)
    dispatch({
      type: PRESENCE_UPDATE,
      payload: { status: presenceStatusEnum.DISCONNECTED, error },
    })
  }
}

async function getPresenceAgentList(
  { dispatch, getState },
  { presence },
  classroomId
) {
  const agentBackoff = new Backoff()
  const agentMap = {}
  const REQUEST_LIMIT = 1000
  const RETRY_LIMIT = 3
  let lastSequenceId = 0
  let result = []
  let retryCount = 0

  dispatch({
    type: AGENT_UPDATE,
    payload: { status: agentStatusEnum.PENDING },
  })

  // fetch agents
  debug('[agent] loop start')
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (retryCount > 0) {
        debug('[agent] retryCount:', retryCount)
      }

      debug('[agent] request with sequenceId:', lastSequenceId)
      const response = await presence.listAgent(classroomId, {
        limit: REQUEST_LIMIT,
        sequenceId: lastSequenceId,
      })

      debug('[agent] response', response)

      result = [...result, ...response]

      if (response.length < REQUEST_LIMIT) {
        break
      }

      lastSequenceId = response[response.length - 1].sequence_id

      // reset 'retry' state
      retryCount = 0

      agentBackoff.reset()
    } catch (error) {
      debug('[agent] catch', error)

      const { status } = error
      const isErrorUnrecoverable = !!status
      const retryLimitExceeded = retryCount === RETRY_LIMIT

      // error is unrecoverable OR retry limit reached
      // update agent state and return
      if (isErrorUnrecoverable || retryLimitExceeded) {
        if (isErrorUnrecoverable)
          debug('[agent] received unrecoverable api error')
        if (retryLimitExceeded) debug('[agent] retry limit exceeded')

        const actionPayload = {
          buffer: [],
          data: {},
          error,
          status: agentStatusEnum.FAILED,
        }

        dispatch({ type: AGENT_UPDATE, payload: actionPayload })

        return
      }

      // drop local state
      lastSequenceId = 0
      result = []

      // increment retry count
      retryCount += 1

      // perform backoff delay
      debug('[agent] sleep:', agentBackoff.value)
      await sleep(agentBackoff.value)

      agentBackoff.next()
    }
  }

  debug('[agent] loop end')
  debug('[agent] result', result)

  // deduplicate agents (result of several http requests may contain duplicated agents)
  for (const item of result) {
    const { agent_id, sequence_id } = item

    if (!agentMap[agent_id] || agentMap[agent_id].sequence_id < sequence_id) {
      agentMap[agent_id] = { ...item, online: true }
    } else {
      debug('[agent] result deduplication: ignore item', item)
    }
  }

  debug('[agent] agentMap', agentMap)
  debug(
    '[agent] agentMap length after deduplication',
    result.length,
    '-->',
    Object.keys(agentMap).length
  )

  // find min sequence_id from agents
  const minSequenceId = Object.values(agentMap).reduce(
    (accumulator, item) =>
      accumulator === -1
        ? item.sequence_id
        : item.sequence_id < accumulator
        ? item.sequence_id
        : accumulator,
    -1
  )

  debug('[agent] minSequenceId', minSequenceId)

  const buffer = selectAgentNotificationBuffer(getState())

  const sortedBuffer = [...buffer].sort(
    (a, b) => a.id.sequence_id - b.id.sequence_id
  )
  const filteredBuffer = sortedBuffer.filter(
    (_) => _.id.sequence_id > minSequenceId
  )

  debug('[agent] buffer', buffer)
  debug('[agent] sortedBuffer', sortedBuffer)
  debug('[agent] filteredBuffer', filteredBuffer)

  // applying notifications from buffer
  for (const notification of filteredBuffer) {
    const { id, payload } = notification
    const { operation, sequence_id } = id
    const { agent_id } = payload

    // add OR overwrite agent
    if (!agentMap[agent_id] || sequence_id > agentMap[agent_id].sequence_id) {
      agentMap[agent_id] = {
        sequence_id,
        agent_id,
        online: operation === agentEntityOperationEnum.ENTERED,
      }
    }
  }

  const actionPayload = {
    buffer: [],
    data: agentMap,
    status: agentStatusEnum.SUCCEEDED,
  }

  dispatch({ type: AGENT_UPDATE, payload: actionPayload })
}

const createPresenceMiddleware =
  ({ presence, presenceWs }) =>
  ({ getState, dispatch }) => {
    const boundedMessageHandler = messageHandler.bind(undefined, {
      dispatch,
      getState,
    })
    const boundedStartPresenceFlow = startPresenceFlow.bind(
      undefined,
      {
        dispatch,
        getState,
      },
      { presence, presenceWs }
    )
    const boundedGetPresenceAgentList = getPresenceAgentList.bind(
      undefined,
      {
        dispatch,
        getState,
      },
      { presence, presenceWs }
    )

    presenceWs.on('event', boundedMessageHandler)

    return (next) => (action) => {
      const { type, payload } = action

      switch (type) {
        case PRESENCE_CONNECT: {
          const { agentLabel, classroomId } = payload
          const presenceStatus = selectPresenceStatus(getState())

          if (
            presenceStatus === presenceStatusEnum.IDLE ||
            presenceStatus === presenceStatusEnum.DISCONNECTED
          ) {
            boundedStartPresenceFlow(classroomId, agentLabel)
          }

          return
        }

        case PRESENCE_DISCONNECT: {
          const presenceStatus = selectPresenceStatus(getState())

          if (
            presenceStatus === presenceStatusEnum.PENDING ||
            presenceStatus === presenceStatusEnum.CONNECTED
          ) {
            presenceWs.disconnect()
          }

          return
        }

        case PRESENCE_UPDATE: {
          next(action)

          const presenceStatus = selectPresenceStatus(getState())

          if (presenceStatus === presenceStatusEnum.DISCONNECTED) {
            dispatch({ type: AGENT_RESET, payload: undefined })
          }

          return
        }

        case AGENT_REQUEST: {
          const { classroomId } = payload
          const agentStatus = selectAgentStatus(getState())

          if (agentStatus !== agentStatusEnum.PENDING) {
            boundedGetPresenceAgentList(classroomId)
          }

          return
        }

        default:
          next(action)
      }
    }
  }

export default createPresenceMiddleware
