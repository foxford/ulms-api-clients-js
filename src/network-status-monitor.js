/* global window */
// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

class NetworkStatusMonitor extends EventEmitter {
  static events = {
    ONLINE: 'online',
  }

  static get status() {
    return window.navigator.onLine
  }

  constructor() {
    super()

    this.offlinePromise = undefined
    this.offlineResolveFn = undefined
    this.onlinePromise = undefined
    this.onlineResolveFn = undefined

    window.addEventListener('offline', this.handleOfflineEvent)
    window.addEventListener('online', this.handleOnlineEvent)
  }

  handleOfflineEvent = () => {
    this.emit(NetworkStatusMonitor.events.ONLINE, NetworkStatusMonitor.status)

    if (this.offlineResolveFn) {
      const resolve = this.offlineResolveFn

      this.offlinePromise = undefined
      this.offlineResolveFn = undefined

      resolve()
    }
  }

  handleOnlineEvent = () => {
    this.emit(NetworkStatusMonitor.events.ONLINE, NetworkStatusMonitor.status)

    if (this.onlineResolveFn) {
      const resolve = this.onlineResolveFn

      this.onlinePromise = undefined
      this.onlineResolveFn = undefined

      resolve()
    }
  }

  waitOffline() {
    if (!NetworkStatusMonitor.status) {
      return Promise.resolve()
    }

    if (this.offlinePromise) {
      return this.offlinePromise
    }

    this.offlinePromise = new Promise((resolve) => {
      this.offlineResolveFn = resolve
    })

    return this.offlinePromise
  }

  waitOnline() {
    if (NetworkStatusMonitor.status) {
      return Promise.resolve()
    }

    if (this.onlinePromise) {
      return this.onlinePromise
    }

    this.onlinePromise = new Promise((resolve) => {
      this.onlineResolveFn = resolve
    })

    return this.onlinePromise
  }

  destroy() {
    this.offlinePromise = undefined
    this.offlineResolveFn = undefined
    this.onlinePromise = undefined
    this.onlineResolveFn = undefined

    window.removeEventListener('offline', this.handleOfflineEvent)
    window.removeEventListener('online', this.handleOnlineEvent)
  }
}

export default NetworkStatusMonitor
