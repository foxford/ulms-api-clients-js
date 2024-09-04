const MIN_DELAY = 500 // 500ms
const MAX_DELAY = 5 * 60 * 1000 // 5m
const MAX_RANDOM_ADDITIVE = 2000 // 2s

// get milliseconds as value
const MILLISECONDS_IN_SECOND = 1000

class Backoff {
  constructor() {
    this.counter = 0
    this.delay = 0

    this.next()
  }

  get value() {
    return this.delay
  }

  next() {
    this.delay = Math.min(
      Math.round(
        MIN_DELAY +
          MILLISECONDS_IN_SECOND * Math.expm1(this.counter) +
          MAX_RANDOM_ADDITIVE * Math.random(),
      ),
      MAX_DELAY,
    )

    this.counter += 1
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  reset() {
    this.counter = 0
    this.delay = 0

    this.next()
  }
}

export default Backoff
