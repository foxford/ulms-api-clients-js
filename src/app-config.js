import Debug from 'debug'

const debug = Debug('app-config')

const parameters = new URLSearchParams(window.location.search)

const AUDIENCE = parameters.get('audience')
const BRAND = parameters.get('brand')
const CONTEXT = parameters.get('context')
const EMBEDDED_ORIGIN = parameters.get('embedded_origin')
const EXTERNAL_ID = parameters.get('external_id')
const IS_AUTOTEST = Boolean(parameters.get('is_autotest'))
const LESSON_ID = parameters.get('lesson_id')
const SCOPE = parameters.get('scope')

// const BACKURL = parameters.get('backurl') // exists, but not used

const appConfig = {
  AUDIENCE,
  BRAND,
  CONTEXT,
  EMBEDDED_ORIGIN,
  EXTERNAL_ID,
  IS_AUTOTEST,
  LESSON_ID,
  SCOPE,
}

debug('available keys', [...parameters.entries()])
debug('config', appConfig)

export default appConfig

export {
  AUDIENCE,
  BRAND,
  CONTEXT,
  EMBEDDED_ORIGIN,
  EXTERNAL_ID,
  IS_AUTOTEST,
  LESSON_ID,
  SCOPE,
}
