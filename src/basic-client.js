const parseParameter = (key, value) => {
  if (Array.isArray(value)) {
    // eslint-disable-next-line unicorn/no-array-reduce
    return value.reduce(
      (accumulator, item) =>
        accumulator ? `${accumulator}&${key}[]=${item}` : `${key}[]=${item}`,
      ''
    )
  }

  if (typeof value === 'object') {
    // eslint-disable-next-line unicorn/no-array-reduce
    return Object.keys(value).reduce(
      (accumulator, attribute) =>
        accumulator
          ? `${accumulator}&${key}[${attribute}]=${value[attribute]}`
          : `${key}[${attribute}]=${value[attribute]}`,
      ''
    )
  }

  return `${key}=${value}`
}

class BasicClient {
  constructor(baseUrl, httpClient, tokenProvider) {
    this.baseUrl = baseUrl
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
    this.labels = {}
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

  static headers(token, labels = {}) {
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...labels,
    }
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

  clearLabels() {
    this.labels = {}
  }

  async get(url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient.headers(token, this.labels)

    return this.httpClient.get(url, { headers })
  }

  async put(url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient.headers(token, this.labels)

    return this.httpClient.put(url, data, { headers })
  }

  async post(url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient.headers(token, this.labels)

    return this.httpClient.post(url, data, { headers })
  }

  async patch(url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient.headers(token, this.labels)

    return this.httpClient.patch(url, data, { headers })
  }

  async delete(url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient.headers(token, this.labels)

    return this.httpClient.delete(url, { headers })
  }
}

export default BasicClient
