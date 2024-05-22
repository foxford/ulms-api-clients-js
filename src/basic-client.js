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

const responseTransformer = (_) => _.data

class BasicClient {
  constructor(baseUrl, httpClient, tokenProvider) {
    this.baseUrl = baseUrl
    this.customHeaders = {}
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
    this.labels = {}
    this.trackEvent = undefined
  }

  url(endpoint, parameters) {
    if (parameters) {
      let urlParameters = ''

      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined) {
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

  static headers(token, labels = {}, headers = {}) {
    return {
      ...headers,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...labels,
    }
  }

  setHeaders(headers) {
    this.customHeaders = headers
  }

  setLabels(labels) {
    const { app_audience, app_label, app_version, scope } = labels // eslint-disable-line camelcase

    this.labels = {
      ...(app_audience !== undefined && { 'ulms-app-audience': app_audience }), // eslint-disable-line camelcase
      ...(app_label !== undefined && { 'ulms-app-label': app_label }), // eslint-disable-line camelcase
      ...(app_version !== undefined && { 'ulms-app-version': app_version }), // eslint-disable-line camelcase
      ...(scope !== undefined && { 'ulms-scope': scope }),
    }
  }

  setTrackEventFunction(trackEvent) {
    this.trackEvent = trackEvent
  }

  clearLabels() {
    this.labels = {}
  }

  async get(url, options = {}) {
    const { retry: retryEnabled } = options

    if (retryEnabled) {
      const task = async () => {
        const token = await this.tokenProvider.getToken()
        const headers = {
          ...options.headers,
          ...BasicClient.headers(token, this.labels, this.customHeaders),
        }
        const requestOptions = { ...options, headers }

        return this.httpClient
          .get(url, requestOptions)
          .then(responseTransformer)
      }

      return retry(task, onRetry)
    }

    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.labels, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient.get(url, requestOptions).then(responseTransformer)
  }

  async put(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.labels, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient
      .put(url, data, requestOptions)
      .then(responseTransformer)
  }

  async post(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.labels, this.customHeaders),
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
        .then(responseTransformer)

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
      .then(responseTransformer)
  }

  async patch(url, data, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.labels, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient
      .patch(url, data, requestOptions)
      .then(responseTransformer)
  }

  async delete(url, options = {}) {
    const token = await this.tokenProvider.getToken()
    const headers = {
      ...options.headers,
      ...BasicClient.headers(token, this.labels, this.customHeaders),
    }
    const requestOptions = { ...options, headers }

    return this.httpClient.delete(url, requestOptions).then(responseTransformer)
  }
}

export default BasicClient
