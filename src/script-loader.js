import { makeDeferred } from './common'

async function loadScript(source) {
  const { promise, resolve, reject } = makeDeferred()
  const scriptElement = document.createElement('script')

  scriptElement.addEventListener('error', () => {
    reject(new Error('loadScript: failed to load'))
  })

  scriptElement.addEventListener('load', () => {
    resolve({ source })
  })

  scriptElement.src = source

  document.head.append(scriptElement)

  return promise
}

export default loadScript
