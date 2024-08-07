import retry, { isErrorRetryable } from './retry'

const onRetry = (error) => !isErrorRetryable(error)

const parseParameter = (key, value) => {
  if (Array.isArray(value)) {
    // eslint-disable-next-line unicorn/no-array-reduce
    return value.reduce(
      (accumulator, item) =>
        accumulator ? `${accumulator}&${key}[]=${item}` : `${key}[]=${item}`,
      '',
    )
  }

  if (typeof value === 'object') {
    // eslint-disable-next-line unicorn/no-array-reduce
    return Object.keys(value).reduce(
      (accumulator, attribute) =>
        accumulator
          ? `${accumulator}&${key}[${attribute}]=${value[attribute]}`
          : `${key}[${attribute}]=${value[attribute]}`,
      '',
    )
  }

  return `${key}=${value}`
}

async function handleResponse() {
  throw new Error('Method `handleResponse` not implemented.')
}

class BasicClient {
  constructor(baseUrl, httpClient, tokenProvider) {
    this.baseUrl = baseUrl
    this.customHeaders = {}
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
    this.trackEvent = undefined
    this.handleResponse = handleResponse
  }

  url(endpoint, parameters) {
    if (parameters) {
      let urlParameters = ''

      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined && value !== null) {
          urlParameters += urlParameters
            ? `&${parseParameter(key, value)}`
            : parseParameter(key, value)
        }
      }

      if (urlParameters) {
        return `${this.baseUrl}${endpoint}?${urlParameters}`
      }
    }

    return `${this.baseUrl}${endpoint}`
  }

  static headers(token, headers = {}) {
    return {
      ...headers,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    }
  }

  setHeaders(headers) {
    this.customHeaders = headers
  }

  setTrackEventFunction(trackEvent) {
    this.trackEvent = trackEvent
  }

  async get(url, options = {}) {
    const { retry: retryEnabled } = options

    if (retryEnabled) {
      const task = async () => {
        const token = await this.tokenProvider.getToken()
        const headers = {
          ...options.headers,
          ...BasicClient.headers(token, this.customHeaders),
        }
        const requestOptions = { ...options, headers }

        return this.httpClient
          .get(url, requestOptions)
          .then(this.handleResponse)
      }

      return retry(task, onRetry)
    }

    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient.get(url, requestOptions).then(this.handleResponse)
  }

  async put(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient
      .put(url, data, requestOptions)
      .then(this.handleResponse)
  }

  async post(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    // [debug section] start
    if (this.trackEvent) {
      const { exp } = JSON.parse(atob(token.split('.')[1]))
      const requestStart = Date.now()
      const expiresAtLocal = this.tokenProvider.tokenData
        ? this.tokenProvider.tokenData.expires_ts
        : undefined
      const result = this.httpClient
        .post(url, data, requestOptions)
        .then(this.handleResponse)

      result.catch((error) => {
        const responseEnd = Date.now()

        const eventPayload = {
          exp: exp * 1000,
          expiresAtLocal,
          requestStart,
          responseEnd,
        }

        if (error && error.type === 'invalid_authentication') {
          this.trackEvent(eventPayload)
        }
      })

      return result
    }
    // [debug section] end

    return this.httpClient
      .post(url, data, requestOptions)
      .then(this.handleResponse)
  }

  async patch(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient
      .patch(url, data, requestOptions)
      .then(this.handleResponse)
  }

  async delete(url, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient.delete(url, requestOptions).then(this.handleResponse)
  }
}

export default BasicClient
