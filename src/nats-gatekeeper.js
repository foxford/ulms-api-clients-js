import BasicClient from './basic-client'

class NatsGatekeeper extends BasicClient {
  /**
   * Fetch token data
   * @param {string} audience
   * @param {string} classroomId
   * @returns {Promise}
   */
  fetchTokenData(audience, classroomId) {
    return this.post(
      this.url(`/audiences/${audience}/classrooms/${classroomId}/tokens`)
    )
  }
}

export default NatsGatekeeper
