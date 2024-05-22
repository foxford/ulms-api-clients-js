import BasicClient from '../src/basic-client'

const methodFunctionMock = jest.fn(() =>
  Promise.resolve({ data: {}, status: 200 }),
)
const baseUrl = 'https://test.url'
const httpClient = {
  get: methodFunctionMock,
  put: methodFunctionMock,
  post: methodFunctionMock,
  patch: methodFunctionMock,
  delete: methodFunctionMock,
}
const tokenProvider = {
  getToken: jest.fn().mockImplementation(() => 'token'),
}

const headersWithoutLabels = {
  authorization: 'Bearer token',
  'content-type': 'application/json',
}

const Client = new BasicClient(baseUrl, httpClient, tokenProvider)

const labels = {
  app_audience: 'audience',
  app_label: 'label',
  app_version: 'version',
  scope: 'scope',
}

const ulmsLabels = {
  'ulms-app-audience': 'audience',
  'ulms-app-label': 'label',
  'ulms-app-version': 'version',
  'ulms-scope': 'scope',
}

const urlGeneratorCases = [
  ['objectParams', { a: 0, b: 1, c: 2 }, '?a=0&b=1&c=2'],
  [
    'advancedObjectParams',
    { a: 'a', b: [1, 2, 3], c: { cc: 3, dd: 4 } },
    '?a=a&b[]=1&b[]=2&b[]=3&c[cc]=3&c[dd]=4',
  ],
  ['objectParamsUndefined', { a: undefined }, ''],
  ['arrayParams', ['a', 'b', 'c'], '?0=a&1=b&2=c'],
  [
    'advancedArrayParams',
    { alphabet: ['a', 'b', 'c'] },
    '?alphabet[]=a&alphabet[]=b&alphabet[]=c',
  ],
  ['withoutParams', undefined, ''],
]

const methodsWithoutDataCases = [['get'], ['delete']]

const methodsWithDataCases = [
  ['post', 'data'],
  ['put', 'data'],
  ['patch', 'data'],
]
describe('Basic client suite', () => {
  it.each(urlGeneratorCases)(
    'URL generator should work with: endpoint — %s and %j as params',
    (endpoint, parameters, expectedParameters) => {
      const resultUrl = Client.url(`/${endpoint}`, parameters)
      expect(resultUrl).toBe(`${baseUrl}/${endpoint}${expectedParameters}`)
    },
  )

  it('Headers should compare with labels', () => {
    const resultHeaders = BasicClient.headers('token', { label: 'a' })
    expect(resultHeaders.authorization).toBe('Bearer token')
    expect(resultHeaders['content-type']).toBe('application/json')
    expect(resultHeaders.label).toBe('a')
  })

  it('Headers should compare without labels', () => {
    const resultHeaders = BasicClient.headers('token')
    expect(resultHeaders).toEqual(headersWithoutLabels)
  })

  it('Labels should set and destroy', () => {
    Client.setLabels(labels)
    expect(Client.labels).toEqual(ulmsLabels)

    Client.clearLabels()
    expect(Client.labels).toEqual({})
  })

  it.each(methodsWithoutDataCases)(
    '%s method should work (without labels)',
    async (method) => {
      await Client[method](baseUrl)
      expect(httpClient[method]).toBeCalledWith(baseUrl, {
        headers: headersWithoutLabels,
      })
    },
  )

  it.each(methodsWithoutDataCases)(
    '%s method should work (with labels)',
    async (method) => {
      Client.setLabels(labels)
      await Client[method](baseUrl)
      Client.clearLabels()
      expect(httpClient[method]).toBeCalledWith(baseUrl, {
        headers: { ...headersWithoutLabels, ...ulmsLabels },
      })
    },
  )

  it.each(methodsWithDataCases)(
    '%s method should work (without labels) with payload: %s',
    async (method, data) => {
      await Client[method](baseUrl, data)
      expect(httpClient[method]).toBeCalledWith(baseUrl, data, {
        headers: headersWithoutLabels,
      })
    },
  )

  it.each(methodsWithDataCases)(
    '%s method should work (with labels) with payload: %s',
    async (method, data) => {
      Client.setLabels(labels)
      await Client[method](baseUrl, data)
      Client.clearLabels()
      expect(httpClient[method]).toBeCalledWith(baseUrl, data, {
        headers: { ...headersWithoutLabels, ...ulmsLabels },
      })
    },
  )
})
