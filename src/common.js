import Backoff from './backoff'
import { TimeoutError } from './error'

// eslint-disable-next-line default-param-last
export function rejectByTimeout(promise, timeout = 5000, context) {
  const contextString = context ? `[${context}] ` : ''

  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(
        reject,
        timeout,
        new TimeoutError(
          `${contextString}Service or another peer not responding more than ${timeout} ms`,
        ),
      )
    }),
  ])
}

export function enterRoom(client, roomId, agentId, timeout = 5000) {
  const ENTER_ROOM = 'room.enter'
  let rejectFunction
  let resolveFunction
  const p = new Promise((resolve, reject) => {
    rejectFunction = reject
    resolveFunction = resolve
  })

  function enterEventHandler(event) {
    if (event.data.agent_id === agentId) {
      client.off(ENTER_ROOM, enterEventHandler)

      resolveFunction()
    }
  }

  client.on(ENTER_ROOM, enterEventHandler)

  client.enterRoom(roomId).catch((error) => {
    client.off(ENTER_ROOM, enterEventHandler)

    rejectFunction(error)
  })

  return rejectByTimeout(p, timeout, ENTER_ROOM).catch((error) => {
    client.off(ENTER_ROOM, enterEventHandler)

    throw error
  })
}

export const sleep = async (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export async function enterServiceRoom(
  client,
  httpClient,
  eventName,
  roomId,
  id,
  label,
  trackEvent,
  serviceName,
) {
  const backoff = new Backoff()
  const isTransportConnected = () => client.mqtt.connected
  let enterRoomSuccess = false
  let response

  const handler = (event) => {
    if (event.data.agent_id === id) {
      enterRoomSuccess = true

      client.off(eventName, handler)
    }
  }

  client.on(eventName, handler)

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!isTransportConnected()) {
        throw new Error('MQTT client disconnected')
      }

      // eslint-disable-next-line no-await-in-loop
      response = await httpClient.enterRoom(roomId, label)

      if (!isTransportConnected()) {
        throw new Error('MQTT client disconnected')
      }

      if (enterRoomSuccess) break

      // eslint-disable-next-line no-await-in-loop
      await sleep(backoff.value)

      backoff.next()

      if (enterRoomSuccess) break

      trackEvent('Debug', `${serviceName}.Subscription.Retry`)
    }
  } catch (error) {
    client.off(eventName, handler)

    backoff.reset()

    throw error
  }

  backoff.reset()

  return response
}

export const deferredStatusEnum = {
  PENDING: 'pending',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
}

export function makeDeferred() {
  const deferred = {}

  deferred.promise = new Promise((resolve, reject) => {
    deferred.state = deferredStatusEnum.PENDING
    deferred.resolve = resolve
    deferred.reject = reject
  })

  deferred.promise
    // eslint-disable-next-line promise/always-return
    .then(() => {
      deferred.state = deferredStatusEnum.RESOLVED
    })
    .catch(() => {
      deferred.state = deferredStatusEnum.REJECTED
    })

  return deferred
}

export const timeout = async (delay) => {
  let resolveFunction
  const promise = new Promise((resolve) => {
    resolveFunction = resolve
  })
  const ts0 = Date.now()
  const id = setInterval(() => {
    const ts = Date.now()

    if (ts - ts0 >= delay) {
      clearInterval(id)
      resolveFunction()
    }
  }, 60 * 1e3) // 60 seconds

  return promise
}
