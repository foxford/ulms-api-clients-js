import BasicClient from './basic-client'

class FVS extends BasicClient {
  /**
   * Get issue types in Minigroup
   * @returns {Promise}
   */
  getIssueTypes() {
    return this.get(`${this.baseUrl}/ulms-issues/types`)
  }

  /**
   * Create issue in Minigroup
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

  /**
   * Get issue categories in Webinar
   * @returns {Promise}
   */
  getIssueCategories() {
    return this.get(`${this.baseUrl}/api/livestreaming/ulms/issueCategories`)
  }

  /**
   * @typedef {Object} WebinarIssue
   * @property {string} description
   * @property {boolean} isCutVideo
   * @property {boolean} isNeedHelp
   * @property {string} scope
   * @property {number} subcategoryId
   * /

  /**
   * Create issue in Webinar
   * @param {WebinarIssue} payload
   * @returns {Promise}
   */
  createWebinarIssue(payload) {
    return this.post(`${this.baseUrl}/api/livestreaming/ulms/issues`, payload)
  }
}

export default FVS
