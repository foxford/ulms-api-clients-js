import BasicClient from './basic-client'

class Portal extends BasicClient {

  /**
   * Get portal options
   * @returns {Promise}
   */
  getOptions() {
    return this.get(this.baseUrl)
  }
}

export default Portal
