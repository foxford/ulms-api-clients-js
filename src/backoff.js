const FACTOR = 2
const MAX_DELAY = 5 * 60 * 1000 // 5m
const RANDOM_ADDITIVE_MAX = 1000 // 1s

// get milliseconds as value
const MILLISECONDS_IN_SECOND = 1000

function getRandomIntInclusive(min, max) {
  const minValue = Math.ceil(min)
  const maxValue = Math.floor(max)

  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxValue - minValue + 1) + minValue)
}

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
    if (this.delay < MAX_DELAY) {
      const randomAdditive = getRandomIntInclusive(0, RANDOM_ADDITIVE_MAX)

      // first delay always equals to randomAdditive
      this.delay =
        this.counter === 0
          ? randomAdditive
          : Math.min(
              MILLISECONDS_IN_SECOND * FACTOR ** this.counter + randomAdditive,
              MAX_DELAY,
            )
    }

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
