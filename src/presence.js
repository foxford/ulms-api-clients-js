import BasicClient from './basic-client'
import { PresenceError } from './error'

async function handleResponse(response) {
  let data

  try {
    data = await response.json()
  } catch (error) {
    throw new PresenceError(PresenceError.decodeErrorKinds.JSON_PARSE_ERROR, {
      cause: error,
    })
  }

  if (!response.ok) {
    const {
      // new error format
      kind = '',
      is_transient: isTransient = false,

      // old error format (ProblemDetail { type: string, title: string, detail: string })
      // todo: remove after migration to new error format
      type,
    } = data
    let errorPayload = {
      kind,
      isTransient,
    }

    // override error payload in case of old error format (or another format from portal or fvs, etc...)
    // todo: remove after migration to new error format
    if (type !== undefined) {
      errorPayload = {
        kind: type,
        isTransient,
      }
    }

    throw PresenceError.fromPayload(errorPayload)
  }

  return data
}

class Presence extends BasicClient {
  constructor(...arguments_) {
    super(...arguments_)

    this.handleResponse = handleResponse
  }

  /**
   * List agent
   * @param {string} classroomId
   * @param {object} filterParameters
   * @returns {Promise}
   */
  listAgent(classroomId, filterParameters = {}) {
    // `sequence_id` - параметр фильтра, монотонно растущий
    // идентификатор сессии агента в рамках сервиса Presence.
    // Ответ сервиса содержит список агентов, отсортированных
    // в порядке возрастания `sequence_id`. Используется в запросе
    // для постраничного листинга списка агентов
    const { limit = 1000, sequenceId = 0 } = filterParameters

    return this.get(
      this.url(`/classrooms/${classroomId}/agents`, {
        limit,
        sequence_id: sequenceId,
      }),
    )
  }
}

export default Presence
