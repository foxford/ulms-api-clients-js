// eslint-disable-next-line unicorn/prefer-node-protocol
import EventEmitter from 'events'

import { makeDeferred } from './common'

// eslint-disable-next-line unicorn/prefer-event-target
class VisibilityStateMonitor extends EventEmitter {
  static events = {
    CHANGE: 'change',
  }

  static states = {
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
  }

  static get isHidden() {
    return VisibilityStateMonitor.state === VisibilityStateMonitor.states.HIDDEN
  }

  static get isVisible() {
    return (
      VisibilityStateMonitor.state === VisibilityStateMonitor.states.VISIBLE
    )
  }

  static get state() {
    return document.visibilityState
  }

  constructor() {
    super()

    this.hiddenPromise = undefined
    this.visiblePromise = undefined

    document.addEventListener('visibilitychange', this.handleEvent)
  }

  handleEvent = () => {
    this.emit(
      VisibilityStateMonitor.events.CHANGE,
      VisibilityStateMonitor.state,
    )

    if (this.constructor.isHidden) {
      if (this.hiddenPromise) {
        const { resolve } = this.hiddenPromise

        this.hiddenPromise = undefined

        resolve()
      }
    } else if (this.visiblePromise) {
      const { resolve } = this.visiblePromise

      this.visiblePromise = undefined

      resolve()
    }
  }

  isHidden() {
    return this.constructor.isHidden
  }

  isVisible() {
    return this.constructor.isVisible
  }

  waitHidden() {
    if (this.constructor.isHidden) {
      return Promise.resolve()
    }

    if (!this.hiddenPromise) {
      this.hiddenPromise = makeDeferred()
    }

    return this.hiddenPromise.promise
  }

  waitVisible() {
    if (this.constructor.isVisible) {
      return Promise.resolve()
    }

    if (!this.visiblePromise) {
      this.visiblePromise = makeDeferred()
    }

    return this.visiblePromise.promise
  }

  destroy() {
    this.hiddenPromise = undefined
    this.visiblePromise = undefined

    document.removeEventListener('visibilitychange', this.handleEvent)
  }
}

export default VisibilityStateMonitor
