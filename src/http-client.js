/* global fetch */

export class FetchHttpClient {
  static _handleResponse (response) {
    if (!response.ok) {
      return response.json()
        .catch(() => response.text())
        .catch(() => ({ status: response.status, statusText: response.statusText }))
        .then((response) => {
          throw response
        })
    }

    return response.json()
  }

  get (url, config) {
    return fetch(url, {
      method: 'GET',
      headers: config.headers
    })
      .then(FetchHttpClient._handleResponse)
  }

  // patch (url, data, config) {
  //   return fetch(url, {
  //     method: 'PATCH',
  //     headers: config.headers,
  //     body: JSON.stringify(data)
  //   })
  //     .then((response) => response.json())
  // }
}