import chunk from 'lodash/chunk'
import throttle from 'lodash/throttle'
// eslint-disable-next-line import/no-unresolved
import PQueue from 'p-queue'

class ProfileService {
  constructor(client, options = {}) {
    const {
      chunkLimit = 35,
      concurrency = 1,
      interval = 1000,
      intervalCap = 2,
    } = options

    this.client = client
    this.chunkLimit = chunkLimit
    this.profileMap = {}
    this.queue = new PQueue({ concurrency, interval, intervalCap })
    this.throttledPerformFetch = throttle(this.performFetch.bind(this), 200, {
      leading: false,
    })
  }

  performFetch() {
    const keys = Object.keys(this.profileMap).filter(
      (_) => this.profileMap[_].state === 'new',
    )
    const keyChunks = chunk(keys, this.chunkLimit)

    if (keyChunks.length === 0) return

    for (const keyChunk of keyChunks) {
      const [, scope] = keyChunk[0].split(':')
      const ids = keyChunk.map((_) => _.split(':')[0])

      for (const key of keyChunk) {
        this.profileMap[key].state = 'pending'
      }

      this.queue.add(() =>
        this.client
          .listProfile(ids, scope)
          .then((response) => {
            for (const profile of response) {
              const { id } = profile

              this.resolve(`${id}:${scope}`, profile)
            }
          })
          .catch((error) => {
            for (const key of keyChunk) this.reject(key, error)
          }),
      )
    }
  }

  resolve(key, data) {
    const { resolve } = this.profileMap[key]

    this.profileMap[key].data = data
    this.profileMap[key].state = 'fulfilled'

    delete this.profileMap[key].promise
    delete this.profileMap[key].resolve
    delete this.profileMap[key].reject

    resolve(this.profileMap[key].data)
  }

  reject(key, error) {
    const { reject } = this.profileMap[key]

    delete this.profileMap[key]

    reject(error)
  }

  forceReadProfile(id, scope) {
    return this.client.readProfile(id, scope, true)
  }

  readMeProfile(scope) {
    return this.client.readProfile('me', scope)
  }

  readProfile(id, scope) {
    const key = `${id}:${scope}`
    const profile = this.profileMap[key]

    // already has profile in map
    if (profile) {
      const { data, promise, state } = profile

      if (state === 'new' || state === 'pending') {
        return promise
      }

      if (state === 'fulfilled') {
        return Promise.resolve(data)
      }
    }

    // new profile
    let promiseFunctionMap = {}
    const promise = new Promise((resolve, reject) => {
      promiseFunctionMap = {
        resolve,
        reject,
      }
    })

    this.profileMap[key] = {
      ...promiseFunctionMap,
      data: undefined,
      promise,
      state: 'new',
    }

    this.throttledPerformFetch()

    return promise
  }
}

export default ProfileService
