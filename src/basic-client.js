export class BasicClient {
  constructor (endpoint, httpClient, tokenProvider) {
    this.endpoint = endpoint
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
  }

  static _headers (token) {
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    }
  }

  async _get (url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token)

    return this.httpClient.get(url, { headers })
  }

  async _put (url, data) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token)

    return this.httpClient.put(url, data, { headers })
  }
}
