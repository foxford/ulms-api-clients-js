import HttpEvent, { eventEndpoints } from '../src/http-event'

const baseUrl = 'https://test.url'
const httpClient = {
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}
const tokenProvider = {
  getToken: jest.fn().mockImplementation(() => 'token'),
}

const headersWithoutLabels = {
  authorization: 'Bearer token',
  'content-type': 'application/json',
}

const eventClient = new HttpEvent(baseUrl, httpClient, tokenProvider)

const roomId = 'room'
const accountId = 'account_id'
const editionId = 'edition_id'
const data = 'data123'
const event = 'event'
const type = 'type'
const agentLabel = 'agentLabel'
const filterParameters = {
  attribute: 'attribute',
  limit: 'limit',
  occurred_at: 'occurred_at',
  original_occurred_at: 'original_occurred_at',
}
const eventParameters = {
  attribute: filterParameters.attribute,
  is_claim: 'is_claim',
  is_persistent: 'is_persistent',
  label: 'label',
  set: 'set',
}

const enterRoomCases = [
  [agentLabel, true],
  [agentLabel, false],
  [agentLabel, undefined],
  [undefined, undefined],
]

describe('Http event client should work', () => {
  it('ReadRoom method works', async () => {
    await eventClient.readRoom(roomId)
    const entryPoint = eventEndpoints.roomRead(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('UpdateRoom method works', async () => {
    await eventClient.updateRoom(roomId, { data })
    const entryPoint = eventEndpoints.roomUpdate(roomId)
    expect(httpClient.patch).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      { data },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.patch).toBeCalledTimes(1)
  })

  it.each(enterRoomCases)(
    'EnterRoom method works with agent label: %p and broadcastSubscription: %p',
    async (label, broadcast) => {
      await eventClient.enterRoom(roomId, label, broadcast)
      const entryPoint = eventEndpoints.roomEnter(roomId)
      expect(httpClient.post).toBeCalledWith(
        `${baseUrl}${entryPoint}`,
        { agent_label: label, broadcast_subscription: broadcast !== false },
        {
          headers: { ...headersWithoutLabels },
        }
      )
      expect(httpClient.post).toBeCalledTimes(1)
    }
  )

  it('ListAgent method works', async () => {
    await eventClient.listAgent(roomId, filterParameters)
    const entryPoint = eventEndpoints.agentsList(roomId)
    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}${entryPoint}?\
attribute=${filterParameters.attribute}&\
limit=${filterParameters.limit}&\
occurred_at=${filterParameters.occurred_at}&\
original_occurred_at=${filterParameters.original_occurred_at}`,
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('ListAgent method works without filter parameters', async () => {
    await eventClient.listAgent(roomId)
    const entryPoint = eventEndpoints.agentsList(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('updateAgent should works', async () => {
    await eventClient.updateAgent(roomId, accountId, true, 'reason')
    const entryPoint = eventEndpoints.agentsUpdate(roomId)
    expect(httpClient.patch).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      { account_id: accountId, reason: 'reason', value: true },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.patch).toBeCalledTimes(1)
  })

  it('listBans should works', async () => {
    await eventClient.listBans(roomId)
    const entryPoint = eventEndpoints.banList(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('createEvent should works', async () => {
    await eventClient.createEvent(roomId, type, { data }, eventParameters)
    const entryPoint = eventEndpoints.eventsCreate(roomId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      {
        attribute: eventParameters.attribute,
        data: {
          data,
        },
        is_claim: eventParameters.is_claim,
        is_persistent: eventParameters.is_persistent,
        label: eventParameters.label,
        set: eventParameters.set,
        type,
      },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('createEvent should works without event parameters', async () => {
    await eventClient.createEvent(roomId, type, { data })
    const entryPoint = eventEndpoints.eventsCreate(roomId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      {
        data: {
          data,
        },
        type,
      },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('listEvent should works', async () => {
    await eventClient.listEvent(roomId)
    const entryPoint = eventEndpoints.eventsList(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('updateLockedTypes should works', async () => {
    await eventClient.updateLockedTypes(roomId, { data })
    const entryPoint = eventEndpoints.roomUpdateLockedTypes(roomId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      { locked_types: { data } },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('readState should works', async () => {
    await eventClient.readState(roomId, [data], filterParameters)
    const entryPoint = eventEndpoints.roomState(roomId)
    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}${entryPoint}?\
attribute=${filterParameters.attribute}&\
limit=${filterParameters.limit}&\
occurred_at=${filterParameters.occurred_at}&\
original_occurred_at=${filterParameters.original_occurred_at}&\
sets[]=${data}`,
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('readState should works without filter params', async () => {
    await eventClient.readState(roomId, [data])
    const entryPoint = eventEndpoints.roomState(roomId)
    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}${entryPoint}?sets[]=${data}`,
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('createEdition should works', async () => {
    await eventClient.createEdition(roomId)
    const entryPoint = eventEndpoints.editionsCreate(roomId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      undefined,
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('listEdition should works', async () => {
    await eventClient.listEdition(roomId)
    const entryPoint = eventEndpoints.editionsList(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('deleteEdition should works', async () => {
    await eventClient.deleteEdition(editionId)
    const entryPoint = eventEndpoints.editionsDelete(editionId)
    expect(httpClient.delete).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.delete).toBeCalledTimes(1)
  })

  it('commitEdition should works', async () => {
    await eventClient.commitEdition(editionId)
    const entryPoint = eventEndpoints.editionsCommit(editionId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      undefined,
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('createChange should works', async () => {
    await eventClient.createChange(editionId, type, event)
    const entryPoint = eventEndpoints.changesCreate(editionId)
    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}${entryPoint}`,
      { event, type },
      {
        headers: { ...headersWithoutLabels },
      }
    )
    expect(httpClient.post).toBeCalledTimes(1)
  })

  it('listChange should works', async () => {
    await eventClient.listChange(roomId)
    const entryPoint = eventEndpoints.changesList(roomId)
    expect(httpClient.get).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.get).toBeCalledTimes(1)
  })

  it('deleteChange should works', async () => {
    await eventClient.deleteChange(editionId)
    const entryPoint = eventEndpoints.changesDelete(editionId)
    expect(httpClient.delete).toBeCalledWith(`${baseUrl}${entryPoint}`, {
      headers: { ...headersWithoutLabels },
    })
    expect(httpClient.delete).toBeCalledTimes(1)
  })
})
