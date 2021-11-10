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

  put (url, data, config) {
    return fetch(url, {
      method: 'PUT',
      headers: config.headers,
      body: JSON.stringify(data)
    })
      .then(FetchHttpClient._handleResponse)
  }

  post (url, data, config) {
    return fetch(url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(data)
    })
      .then(FetchHttpClient._handleResponse)
  }

  patch (url, data, config) {
    return fetch(url, {
      method: 'PATCH',
      headers: config.headers,
      body: JSON.stringify(data)
    })
      .then(FetchHttpClient._handleResponse)
  }

  delete (url, config) {
    return fetch(url, {
      method: 'DELETE',
      headers: config.headers
    })
      .then(FetchHttpClient._handleResponse)
  }
}
