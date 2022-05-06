import BasicClient from './basic-client'

class Presence extends BasicClient {
  /**
   * List agent
   * @param {string} classroomId
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise}
   */
  listAgent(classroomId, offset = 0, limit = 100) {
    return this.get(
      this.url(`/classrooms/${classroomId}/agents`, { offset, limit })
    )
  }
}

export default Presence
