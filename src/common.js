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
          `${contextString}Service or another peer not responding more than ${timeout} ms`
        )
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

const sleep = async (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export async function enterServiceRoom(
  client,
  httpClient,
  roomId,
  id,
  label,
  delay,
  trackEvent,
  serviceName
) {
  const EVENT_NAME = 'room.enter'
  let enterRoomSuccess = false
  let response

  const handler = (event) => {
    if (event.data.agent_id === id) {
      enterRoomSuccess = true

      client.off(EVENT_NAME, handler)
    }
  }

  client.on(EVENT_NAME, handler)

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      response = await httpClient.enterRoom(roomId, label)

      if (enterRoomSuccess) break

      // eslint-disable-next-line no-await-in-loop
      await sleep(delay)

      trackEvent('Debug', `${serviceName}.Subscription.Retry`)
    }
  } catch (error) {
    client.off(EVENT_NAME, handler)

    throw error
  }

  return response
}

export function makeDeferred() {
  const deferred = {}

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  return deferred
}
