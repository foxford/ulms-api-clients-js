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

  async _request (url) {
    const token = await this.tokenProvider.getToken()
    const headers = BasicClient._headers(token)

    return this.httpClient.get(url, { headers })
  }
}
