import BasicClient from './basic-client'
import { TenantError } from './error'

async function handleResponse(response) {
  let data

  try {
    data = await response.json()
  } catch (error) {
    throw new TenantError(TenantError.decodeErrorKinds.JSON_PARSE_ERROR, {
      cause: error,
    })
  }

  if (!response.ok) {
    const { error, errors, messages } = data
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    let errorMessage = `[${response.status}]`

    if (error) {
      errorMessage += ` ${error}`
    }

    if (errors) {
      errorMessage += ` ${errors}`
    }

    if (messages) {
      errorMessage += ` ${messages.join(',')}`
    }

    throw new TenantError(errorMessage)
  }

  return data
}

class Tenant extends BasicClient {
  constructor(...arguments_) {
    super(...arguments_)

    this.handleResponse = handleResponse
  }

  /**
   * Profile role enum
   * @returns {{MODERATOR: string, USER: string}}
   */
  static get role() {
    return {
      MODERATOR: 'moderator',
      USER: 'user',
    }
  }

  /**
   * Read profile
   * @param {string} id
   * @param {string} scope
   * @param {boolean} force
   * @returns {Promise}
   */
  readProfile(id, scope, force = false) {
    return this.get(
      this.url(`/users/${id}`, {
        scope,
        // to avoid Nginx cache
        timestamp: force ? Date.now() : undefined,
      }),
    )
  }

  /**
   * List profiles
   * @param {array} ids
   * @param {string} scope
   * @returns {Promise}
   */
  listProfile(ids, scope) {
    return this.get(this.url(`/users`, { ids: ids.join(','), scope }))
  }

  /**
   * Read tenant scope
   * @param {string} scope
   * @param {string} lessonId
   * @returns {Promise}
   */
  readScope(scope, lessonId) {
    return this.get(this.url(`/webinars/${scope}`, { lesson_id: lessonId }))
  }

  /**
   * List materials
   * @param {string} scope
   * @returns {Promise}
   */
  listMaterial(scope) {
    return this.get(`${this.baseUrl}/webinars/${scope}/materials`)
  }

  /**
   * Create url to material with `id`
   * @param {string} id
   * @returns {string}
   */
  createMaterialUrl(id) {
    return `${this.baseUrl}/materials/${id}`
  }

  /**
   * Get portal options
   * @param {string} optionsEndpoint
   * @returns {Promise}
   */
  getOptions(optionsEndpoint) {
    const { origin } = new URL(this.baseUrl)

    return this.httpClient
      .get(`${origin}/${optionsEndpoint}`, {
        mode: 'cors',
        credentials: 'include',
      })
      .then(this.handleResponse)
  }
}

export default Tenant
