export function rejectByTimeout (promise, timeout) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(reject, timeout, new Error(`Timeout: service or another peer not responding more than ${timeout} ms`))
    })
  ])
}

export function enterRoom (client, roomId, agentId, timeout = 5000) {
  const ENTER_ROOM = 'room.enter'
  let rejectFn
  let resolveFn
  const p = new Promise((resolve, reject) => {
    rejectFn = reject
    resolveFn = resolve
  })

  function enterEventHandler (event) {
    if (event.data.agent_id === agentId) {
      client.off(ENTER_ROOM, enterEventHandler)

      resolveFn()
    }
  }

  client.on(ENTER_ROOM, enterEventHandler)

  client.enterRoom(roomId)
    .catch((error) => {
      client.off(ENTER_ROOM, enterEventHandler)

      rejectFn(error)
    })

  return rejectByTimeout(p, timeout)
    .catch((error) => {
      client.off(ENTER_ROOM, enterEventHandler)

      throw error
    })
}
