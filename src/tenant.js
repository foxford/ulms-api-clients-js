import BasicClient from './basic-client'

class Tenant extends BasicClient {
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
   * @returns {Promise}
   */
  readProfile(id, scope) {
    let qs = ''

    if (scope) {
      qs = `?scope=${scope}`
    }

    return this.get(`${this.baseUrl}/users/${id}${qs}`)
  }

  /**
   * List profiles
   * @param {array} ids
   * @param {string} scope
   * @returns {Promise}
   */
  listProfile(ids, scope) {
    const qs = `?ids=${ids.join(',')}&scope=${scope}`

    return this.get(`${this.baseUrl}/users${qs}`)
  }

  /**
   * Read tenant scope
   * @param {string} scope
   * @returns {Promise}
   */
  readScope(scope) {
    return this.get(`${this.baseUrl}/webinars/${scope}`)
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
}

export default Tenant
