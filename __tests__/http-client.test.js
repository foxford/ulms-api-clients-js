import {FetchHttpClient} from "../src";

const unmockedFetch = global.fetch

beforeAll(() => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve([]),
    }))
})

afterAll(() => {
  global.fetch.mockClear();
  global.fetch = unmockedFetch
})

const baseUrl = 'https://test.url'
const headers = {
  authorization: 'Bearer token',
  'content-type': 'application/json',
}

const casesWithPayload = [
  ["put"],
  ["post"],
  ["patch"]
]

const casesWithoutPayload = [
  ['get'],
  ['delete']
]

const data = {payload: 'OK'}

const client = new FetchHttpClient()

describe('Http client should work', () => {
  it.each(casesWithoutPayload)('%s method works', (method) => {
    client[method](baseUrl, {headers}).catch((error) => error)
    expect(global.fetch).toHaveBeenCalledWith(
      baseUrl, {headers, method: method.toUpperCase()}
    )
    expect(global.fetch).toBeCalledTimes(1)
  })

  it.each(casesWithPayload)('%s method works', (method) => {
    client[method](baseUrl, data, {headers}).catch((error) => error)
    expect(global.fetch).toHaveBeenCalledWith(
      baseUrl,
      {
        body: JSON.stringify(data),
        headers,
        method: method.toUpperCase()
      }
    )
    expect(global.fetch).toBeCalledTimes(1)
  })

  it('json method should work', async () => {
    const fakeJson = jest.fn().mockImplementation(() => new Promise((resolve, reject) => {
      reject(new Error("JSON error"))
    }))

    const fakeText = jest.fn().mockImplementation(() => Promise.reject(new Error("To Text Error")))

    global.fetch = jest.fn().mockImplementation(() =>
      new Promise(resolve => {
        resolve({
          ok: true,
          json: fakeJson,
          text: fakeText,
          status: 'status',
          statusText: 'statusText'
        })
      })
    )
    const response = await client.get(baseUrl, {headers})
    expect(fakeJson).toBeCalledTimes(1)
    expect(fakeText).toBeCalledTimes(1)
    expect(response).toEqual({
      status: 'status',
      statusText: 'statusText'
    })
  })

})
