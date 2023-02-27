/* eslint-disable camelcase, promise/always-return */
import { makeDeferred } from './common'
import { TokenProviderError } from './error'

class TokenProvider {
  constructor(baseUrl, httpClient) {
    this.baseUrl = baseUrl
    this.context = undefined
    this.httpClient = httpClient
    this.tokenData = undefined
    this.tokenP = undefined
  }

  setContext(context) {
    this.context = context
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

      this.fetchTokenData()
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

  fetchTokenData() {
    const qs = this.context ? `?context=${this.context}` : ''
    const url = `${this.baseUrl}/api/user/ulms_token${qs}`

    return this.httpClient.post(url, undefined, { credentials: 'include' })
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
     * */
    let transformedError

    if (
      error instanceof TypeError &&
      error.message.startsWith('Failed to fetch')
    ) {
      transformedError = TokenProviderError.fromType(
        TokenProviderError.types.NETWORK_ERROR
      )
    } else if (error.error) {
      transformedError = TokenProviderError.fromType(
        TokenProviderError.types.UNAUTHENTICATED
      )
    } else {
      transformedError = TokenProviderError.fromType(
        TokenProviderError.types.UNKNOWN_ERROR
      )
    }

    this.tokenP.reject(transformedError)

    this.tokenP = undefined
  }

  resolveAndReset() {
    this.tokenP.resolve(this.tokenData.access_token)

    this.tokenP = undefined
  }

  updateTokenData(updates) {
    const { expires_in } = updates
    const expires_ts = Date.now() + expires_in * 1e3 - 3e3

    this.tokenData = {
      ...this.tokenData,
      ...updates,
      expires_ts,
    }
  }
}

export default TokenProvider
