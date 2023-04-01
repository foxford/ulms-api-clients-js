const MIN_DELAY = 2 * 1000 // 2s
const MAX_DELAY = 5 * 60 * 1000 // 5m
const FACTOR = 2
const RANDOM_ADDITIVE_MAX = 1000 // 1s

function getRandomIntInclusive(min, max) {
  const minValue = Math.ceil(min)
  const maxValue = Math.floor(max)

  // The maximum is inclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxValue - minValue + 1) + minValue)
}

class Backoff {
  constructor(min = MIN_DELAY, max = MAX_DELAY, factor = FACTOR) {
    this.counter = 0
    this.delay = 0
    this.factor = factor
    this.max = max
    this.min = min

    this.next()
  }

  get value() {
    return this.delay
  }

  next() {
    const randomAdditive = getRandomIntInclusive(0, RANDOM_ADDITIVE_MAX)

    // first delay always equals to randomAdditive
    this.delay = Math.min(
      this.min * this.factor ** this.counter - this.min + randomAdditive,
      this.max
    )
    this.counter += 1
  }

  reset() {
    this.counter = 0
    this.delay = 0

    this.next()
  }
}

export default Backoff
