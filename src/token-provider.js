/* eslint-disable camelcase, promise/always-return */
import { makeDeferred } from './common'
import { TokenProviderError } from './error'
import retry, { isErrorRetryable } from './retry'

const onRetry = (error) => !isErrorRetryable(error)

async function handleResponse(response) {
  let data

  try {
    data = await response.json()
  } catch (error) {
    console.log('[TP:handleResponse] body parsing catch', error)
    // todo: change error type (UnexpectedError)
    throw error
  }

  if (!response.ok) {
    // eslint-disable-next-line no-throw-literal
    throw {
      data,
      status: response.status,
    }
  }

  return data
}

class TokenProvider {
  constructor(baseUrl, httpClient) {
    this.baseUrl = baseUrl
    this.context = undefined
    this.errorHandler = undefined
    this.handleResponse = handleResponse
    this.httpClient = httpClient
    this.tokenData = undefined
    this.tokenP = undefined
    this.tokenRequestStart = undefined
  }

  setContext(context) {
    this.context = context
  }

  setErrorHandler(errorHandler) {
    this.errorHandler = errorHandler
  }

  getToken() {
    if (this.tokenP) {
      return this.tokenP.promise
    }

    const isTokenDataEmpty = !this.tokenData
    const isAccessTokenExpired = isTokenDataEmpty
      ? false
      : Date.now() > this.tokenData.expires_ts

    if (isTokenDataEmpty || isAccessTokenExpired) {
      this.tokenP = makeDeferred()
      this.tokenRequestStart = Date.now()

      this.fetchTokenData()
        .then(this.handleResponse)
        .then((response) => {
          this.updateTokenData(response)
          this.resolveAndReset()
        })
        .catch((error) => {
          this.rejectAndReset(error)
        })

      return this.tokenP.promise
    }

    return Promise.resolve(this.tokenData.access_token)
  }

  async fetchTokenData() {
    const qs = this.context ? `?context=${this.context}` : ''
    const url = `${this.baseUrl}/api/user/ulms_token${qs}`
    const task = async () =>
      this.httpClient.post(url, undefined, {
        credentials: 'include',
        headers: {
          'X-Referer': `${window.location.origin}${window.location.pathname}`,
        },
        timeout: 10_000,
      })

    return retry(task, onRetry)
  }

  rejectAndReset(error) {
    /*
     * Errors
     *
     * - unrecoverable (нет смысла повторять запрос)
     *   401 {"error":"Авторизуйтесь"} (когда разлогинился в админке или на портале)
     *   401 {"error":"Войдите, пожалуйста, чтобы приступить к занятиям."} (когда указан неверный контекст для запроса)
     *
     * - network error
     *   error instanceof TypeError && error.message.startsWith('Failed to fetch')
     *     - отсутствует соединение с сетью
     *     - ошибка CORS (внезапно ответ 200, но ошибка по заголовкам)
     *
     * - клиентский таймаут
     * */
    let transformedError

    if (
      error instanceof TypeError &&
      error.message.startsWith('Failed to fetch')
    ) {
      transformedError = new TokenProviderError(
        TokenProviderError.types.NETWORK_ERROR,
        error.message,
        error,
      )
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      transformedError = new TokenProviderError(
        TokenProviderError.types.CLIENT_TIMEOUT,
        'Request was aborted (client timeout)',
        error,
      )
    } else if (error.data && error.data.error) {
      transformedError = new TokenProviderError(
        TokenProviderError.types.UNAUTHENTICATED,
        error.data.error,
        error,
      )
    } else {
      transformedError = new TokenProviderError(
        TokenProviderError.types.UNKNOWN_ERROR,
        error.message,
        error,
      )
    }

    if (this.errorHandler) {
      this.errorHandler(transformedError)
    }

    this.tokenP.reject(transformedError)

    this.tokenP = undefined
    this.tokenRequestStart = undefined
  }

  resolveAndReset() {
    this.tokenP.resolve(this.tokenData.access_token)

    this.tokenP = undefined
    this.tokenRequestStart = undefined
  }

  updateTokenData(updates) {
    const { expires_in } = updates
    const expires_ts = this.tokenRequestStart + expires_in * 1e3 - 20e3

    this.tokenData = {
      ...this.tokenData,
      ...updates,
      expires_ts,
    }
  }
}

export default TokenProvider
