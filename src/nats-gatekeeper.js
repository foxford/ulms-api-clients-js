import BasicClient from './basic-client'

/**
 * @deprecated
 */
class NatsGatekeeper extends BasicClient {
  /**
   * Fetch token data
   * @deprecated
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
