import BasicClient from './basic-client'

class Presence extends BasicClient {
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
