/* eslint-disable class-methods-use-this */
import { NetworkError } from './error'

function createTimeoutSignal(timeout) {
  const controller = new AbortController()
  const { signal } = controller
  const id = setTimeout(() => controller.abort(), timeout)
  const cleanup = () => clearTimeout(id)

  return { cleanup, signal }
}

class FetchHttpClient {
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

    const fetchPromise = fetch(url, requestOptions).catch((error) => {
      throw new NetworkError('', { cause: error })
    })

    if (onFinally) {
      // eslint-disable-next-line promise/catch-or-return
      fetchPromise.finally(() => onFinally())
    }

    return fetchPromise
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
