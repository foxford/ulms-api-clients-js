/* eslint-disable class-methods-use-this */
import { mergeSignals } from './common'
import { NetworkError } from './error'

function createTimeoutSignal(timeout) {
  if (AbortSignal && AbortSignal.timeout) {
    return { signal: AbortSignal.timeout(timeout) }
  }

  const controller = new AbortController()
  const { signal } = controller
  const id = setTimeout(() => controller.abort(), timeout)
  const cleanup = () => clearTimeout(id)

  return { cleanup, signal }
}

class FetchHttpClient {
  async request(url, config) {
    const { signal: appSignal, timeout, ...requestConfig } = config
    const requestOptions = {
      ...requestConfig,
    }
    const signals = []
    let onFinally
    let response

    if (appSignal) {
      signals.push(appSignal)
    }

    if (timeout !== undefined) {
      const { cleanup, signal: timeoutSignal } = createTimeoutSignal(timeout)

      signals.push(timeoutSignal)

      onFinally = cleanup
    }

    if (signals.length > 0) {
      requestOptions.signal = mergeSignals(signals)
    }

    try {
      response = await fetch(url, requestOptions)
    } catch (error) {
      throw new NetworkError('network_error', { cause: error })
    } finally {
      if (onFinally) {
        onFinally()
      }
    }

    return response
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
