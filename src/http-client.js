/* global fetch */
/* eslint-disable class-methods-use-this */

class FetchHttpClient {
  static handleResponse(response) {
    if (!response.ok) {
      return response
        .json()
        .catch(() => response.text())
        .catch(() => ({
          status: response.status,
          statusText: response.statusText,
        }))
        .then((result) => {
          throw result
        })
    }

    return response
      .json()
      .catch(() => response.text())
      .catch(() => ({
        status: response.status,
        statusText: response.statusText,
      }))
  }

  get(url, config) {
    return fetch(url, {
      method: 'GET',
      headers: config.headers,
    }).then(FetchHttpClient.handleResponse)
  }

  put(url, data, config) {
    return fetch(url, {
      method: 'PUT',
      headers: config.headers,
      body: JSON.stringify(data),
    }).then(FetchHttpClient.handleResponse)
  }

  post(url, data, config) {
    return fetch(url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(data),
    }).then(FetchHttpClient.handleResponse)
  }

  patch(url, data, config) {
    return fetch(url, {
      method: 'PATCH',
      headers: config.headers,
      body: JSON.stringify(data),
    }).then(FetchHttpClient.handleResponse)
  }

  delete(url, config) {
    return fetch(url, {
      method: 'DELETE',
      headers: config.headers,
    }).then(FetchHttpClient.handleResponse)
  }
}

export default FetchHttpClient
