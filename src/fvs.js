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
   * Get issue categories for Minigroup
   * @returns {Promise}
   */
  getMinigroupIssueCategories() {
    return this.get(
      `${this.baseUrl}/api/livestreaming/ulms/miniGroup/issueCategories`,
    )
  }

  /**
   * Create issue in Minigroup
   * @param {string} externalId
   * @param {number} typeId
   * @param {string} description
   * @returns {Promise}
   */
  createMinigroupIssue(externalId, typeId, description) {
    const payload = {
      description,
      external_id: externalId,
      typeId,
    }

    return this.post(
      `${this.baseUrl}/api/livestreaming/ulms/miniGroup/issues`,
      payload,
    )
  }

  /**
   * Get issue categories for Webinar
   * @returns {Promise}
   */
  getWebinarIssueCategories() {
    return this.get(`${this.baseUrl}/api/livestreaming/ulms/issueCategories`)
  }

  /**
   * @typedef {Object} WebinarIssue
   * @property {string} description
   * @property {string} external_id
   * @property {boolean} isCutVideo
   * @property {boolean} isNeedHelp
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
