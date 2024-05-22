/* eslint-disable class-methods-use-this */

function createTimeoutSignal(timeout) {
  const controller = new AbortController()
  const { signal } = controller
  const id = setTimeout(() => controller.abort(), timeout)
  const cleanup = () => clearTimeout(id)

  return { cleanup, signal }
}

class FetchHttpClient {
  static async handleResponse(response) {
    const bodyAsText = await response.text()
    let data

    try {
      data = JSON.parse(bodyAsText)
    } catch {
      data = { message: bodyAsText }
    }

    const result = {
      data,
      status: response.status,
    }

    if (!response.ok) {
      throw result
    }

    return result
  }

  request(url, config) {
    const { timeout, ...requestConfig } = config
    const requestOptions = {
      ...requestConfig,
    }
    let onFinally

    if (timeout !== undefined) {
      const { cleanup, signal } = createTimeoutSignal(timeout)

      requestOptions.signal = signal
      onFinally = cleanup
    }

    return fetch(url, requestOptions)
      .then(FetchHttpClient.handleResponse)
      .finally(() => (onFinally ? onFinally() : undefined))
  }

  get(url, config) {
    return this.request(url, {
      ...config,
      method: 'GET',
    })
  }

  put(url, data, config) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  post(url, data, config) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  patch(url, data, config) {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  delete(url, config) {
    return this.request(url, {
      ...config,
      method: 'DELETE',
    })
  }
}

export default FetchHttpClient
