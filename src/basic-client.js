/* eslint-disable camelcase */
export class BasicClient {
  constructor (baseUrl, httpClient, tokenProvider) {
    this.baseUrl = baseUrl
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
    this._labels = {}
  }

  _url (endpoint, params) {
    const parseParameter = (key, value) => {
      if (Array.isArray(value)) {
        return value.reduce((acc, val) => {
          return acc ? `${acc}&${key}[]=${val}` : `${key}[]=${val}`
        }, '')
      }
      if (typeof value === 'object') {
        return Object.keys(value).reduce((acc, attribute) => {
          return acc ? `${acc}&${key}[${attribute}]=${value[attribute]}` : `${key}[${attribute}]=${value[attribute]}`
        }, '')
      }
      return `${key}=${value}`
    }

    if (params) {
      let urlParams = ''
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          urlParams += urlParams ? `&${parseParameter(key, value)}` : parseParameter(key, value)
        }
      }
      if (urlParams) {
        return `https://${this.baseUrl}${endpoint}?${urlParams}`
      }
    }
    return `https://${this.baseUrl}${endpoint}`
  }

  static _headers (token, labels = {}) {
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...labels
    }
  }

  setLabels (labels) {
    const {
      app_audience: ulms_app_audience,
      app_label: ulms_app_label,
      app_version: ulms_app_version,
      scope: ulms_scope
    } = labels

    this._labels = {
      ...(ulms_app_audience !== undefined && { ulms_app_audience }),
      ...(ulms_app_label !== undefined && { ulms_app_label }),
      ...(ulms_app_version !== undefined && { ulms_app_version }),
      ...(ulms_scope !== undefined && { ulms_scope })
    }
  }

  clearLabels () {
    this._labels = {}
  }

  async _get (url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token, this._labels)

    return this.httpClient.get(url, { headers })
  }

  async _put (url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token, this._labels)

    return this.httpClient.put(url, data, { headers })
  }

  async _post (url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token, this._labels)

    return this.httpClient.post(url, data, { headers })
  }

  async _patch (url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token, this._labels)

    return this.httpClient.patch(url, data, { headers })
  }

  async _delete (url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token, this._labels)

    return this.httpClient.delete(url, { headers })
  }
}
