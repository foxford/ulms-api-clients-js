import Backoff from './backoff'
import { sleep } from './common'

const RETRY_LIMIT = 3

async function retry(task, onRetry, retryLimit = RETRY_LIMIT) {
  const backoff = new Backoff()
  let reason
  let result
  let retryCount = 0

  while (retryCount < retryLimit) {
    if (retryCount > 0) {
      if (onRetry) {
        // eslint-disable-next-line no-await-in-loop
        const stop = onRetry(reason, retryCount)

        if (stop) break
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(backoff.value)

      backoff.next()
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      result = await task()
    } catch (error) {
      reason = error
    }

    if (result) break

    retryCount += 1
  }

  backoff.reset()

  if (result) return result

  throw reason
}

function isErrorRetryable(error) {
  /*
  Повторная попытка разрешена для следующих ошибок:
  - [+] клиентская сетевая ошибка ("Failed to fetch *")
  - [+] таймаут запроса
  - [+] HTTP ответ со статус-кодом: 422, 424, 429 или 5xx
   */
  const isNetworkError =
    error instanceof TypeError && error.message.startsWith('Failed to fetch')
  const isTimeoutError =
    error instanceof DOMException && error.name === 'AbortError'
  const isPassedByStatusCode = error.status
    ? error.status === 422 ||
      error.status === 401 ||
      error.status === 424 ||
      error.status === 429 ||
      error.status >= 500
    : false

  return isNetworkError || isTimeoutError || isPassedByStatusCode
}

export default retry

export { isErrorRetryable }
