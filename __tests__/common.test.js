import {enterRoom, rejectByTimeout} from "../src/common";

describe('RejectByTimout should work', () => {
  it('RejectByTimout should throw right message', async () => {
    const promise = new Promise((resolve) => {setTimeout(() => resolve(), 100)})
    const context = "hello"
    await expect(rejectByTimeout(promise, 0, context)).rejects.toThrow(`[${context}] Service or another peer not responding more than 0 ms`)
  })

  it('RejectByTimeout resolve promise', async () => {
    const promise = new Promise((resolve) => {
       resolve('OK');
    })
    const context = 'hello'
    await expect(rejectByTimeout(promise, 100, context)).resolves.toBe('OK')
  })
})

const roomId = '123'
const agentId = '321'

const brokenClient = {
  on: jest.fn()
    .mockImplementationOnce((topic, foo) => {
    foo({
      data: {
        agent_id: 'fake'}
    })
  }),
  // eslint-disable-next-line sonarjs/no-identical-functions
  off: jest.fn().mockImplementationOnce((topic, foo) => {
    foo({
      data: {
        agent_id: 'fake'}
    })
  }),
  enterRoom: jest.fn().mockImplementation(() => new Promise((resolve, reject) => {reject(new Error("From Client"))} ))
}

const client = {
  on: jest.fn().mockImplementationOnce((topic, foo) => {
      foo({
        data: {
          agent_id: agentId}
      })
    }),
  // eslint-disable-next-line sonarjs/no-identical-functions
  off: jest.fn().mockImplementationOnce((topic, foo) => {
      foo({
        data: {
          agent_id: agentId}
      })
    }),
  enterRoom: jest.fn().mockImplementation(() => new Promise(
    (resolve) => {
      resolve('OK')
    }))
}

const ROOM_ENTER = "room.enter"

describe('enterRoom should work', () => {
  it('enterRoom Throwing error', async () => {
    await expect(enterRoom(brokenClient, roomId, agentId, 100)).rejects.toThrow("From Client")
    expect(brokenClient.on).toBeCalledTimes(1)
    expect(brokenClient.on).toBeCalledWith(ROOM_ENTER, expect.any(Function))
    expect(brokenClient.off).toBeCalledTimes(2)
    expect(brokenClient.off).toBeCalledWith(ROOM_ENTER, expect.any(Function))
  })

  it('enterRoom is ok', async () => {
    await expect(enterRoom(client, roomId, agentId, 100)).resolves.toBe(undefined)
    expect(client.on).toBeCalledTimes(1)
    expect(client.on).toBeCalledWith(ROOM_ENTER, expect.any(Function))
    expect(client.off).toBeCalledTimes(2)
    expect(client.off).toBeCalledWith(ROOM_ENTER, expect.any(Function))
  })
})
