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
