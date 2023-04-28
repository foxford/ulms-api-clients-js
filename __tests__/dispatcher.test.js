import { Dispatcher } from '../src'

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
const headers = {
  authorization: 'Bearer token',
  'content-type': 'application/json',
}

const dispatcher = new Dispatcher(baseUrl, httpClient, tokenProvider)
const audience = 'audience'
const scope = 'scope'
const kind = 'kind'

describe('Dispatcher should work', () => {
  it('Static getters work correct', () => {
    const dispatcherKinds = Dispatcher.kind
    const dispatcherStatuses = Dispatcher.scopeStatus

    expect(dispatcherKinds).toEqual({
      CHAT: 'chats',
      MINIGROUP: 'minigroups',
      P2P: 'p2p',
      WEBINAR: 'webinars',
    })

    expect(dispatcherStatuses).toEqual({
      REAL_TIME: 'real-time',
      CLOSED: 'closed',
      FINISHED: 'finished',
      ADJUSTED: 'adjusted',
      TRANSCODED: 'transcoded',
    })
  })

  it('commitEdition should work', async () => {
    const editionId = 'editionId'
    await dispatcher.commitEdition(audience, scope, editionId)

    expect(httpClient.post).toBeCalledWith(
      `${baseUrl}/audiences/${audience}/classes/${scope}/editions/${editionId}`,
      undefined,
      { headers }
    )
  })

  it('readScope should work', async () => {
    await dispatcher.readScope(kind, audience, scope)

    expect(httpClient.get).toBeCalledWith(
      `${baseUrl}/audiences/${audience}/${kind}/${scope}`,
      { headers }
    )
  })

  it('updateScope should work', async () => {
    const data = { payload: 'payload' }
    await dispatcher.updateScope(kind, audience, scope, data)

    expect(httpClient.put).toBeCalledWith(
      `${baseUrl}/audiences/${audience}/${kind}/${scope}`,
      data,
      { headers }
    )
  })
})
