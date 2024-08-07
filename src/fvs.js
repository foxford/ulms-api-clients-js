import BasicClient from './basic-client'
import { FVSError } from './error'

async function handleResponse(response) {
  let data

  try {
    data = await response.json()
  } catch (error) {
    throw new FVSError(FVSError.decodeErrorKinds.JSON_PARSE_ERROR, {
      cause: error,
    })
  }

  if (!response.ok) {
    const { code, detail, message } = data
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    const errorMessage = `[${response.status}]${code ? `[${code}]` : ''} ${detail}: ${message}`

    throw new FVSError(errorMessage)
  }

  return data
}

// fixme: need authorization header
class FVS extends BasicClient {
  constructor(...arguments_) {
    super(...arguments_)

    this.handleResponse = handleResponse
  }

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
