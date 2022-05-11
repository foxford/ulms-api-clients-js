import BasicClient from './basic-client'

class FVS extends BasicClient {
  /**
   * Get issue types
   * @returns {Promise}
   */
  getIssueTypes() {
    return this.get(`${this.baseUrl}/ulms-issues/types`)
  }

  /**
   * Get issue types
   * @param {string} scope
   * @param {number} typeId
   * @param {string} description
   * @returns {Promise}
   */
  createIssue(scope, typeId, description) {
    const payload = {
      description,
      scope,
      typeId,
    }

    return this.post(`${this.baseUrl}/ulms-issues/issues`, payload)
  }
}

export default FVS
