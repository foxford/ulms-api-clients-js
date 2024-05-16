class HttpProfileResource {
  constructor(host, endpoint, httpClient, tokenProvider) {
    this.baseUrl = `${host}/${endpoint}`
    this.httpClient = httpClient
    this.tokenProvider = tokenProvider
  }

  static headers(parameters) {
    return {
      authorization: `Bearer ${parameters.token}`,
      'content-type': 'application/json',
    }
  }

  getProfile(id, scope, force = false) {
    let qs = ''

    if (scope) {
      qs = `?scope=${scope}`
    }

    // to avoid Nginx cache
    if (force) {
      qs += `${qs.length > 0 ? '&' : '?'}timestamp=${Date.now()}`
    }

    return this.tokenProvider.getToken().then((token) =>
      this.httpClient.get(`${this.baseUrl}/users/${id}${qs}`, {
        headers: HttpProfileResource.headers({ token }),
      }),
    )
  }

  listProfiles(ids, scope) {
    const qs = `?ids=${ids.join(',')}&scope=${scope}`

    return this.tokenProvider.getToken().then((token) =>
      this.httpClient.get(`${this.baseUrl}/users${qs}`, {
        headers: HttpProfileResource.headers({ token }),
      }),
    )
  }

  updateAttributes(id, scope, data) {
    const qs = `?scope=${scope}`

    return this.tokenProvider.getToken().then((token) =>
      this.httpClient.patch(`${this.baseUrl}/users/${id}${qs}`, data, {
        headers: HttpProfileResource.headers({ token }),
      }),
    )
  }
}

export default HttpProfileResource
