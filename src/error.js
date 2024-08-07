/* eslint-disable max-classes-per-file, unicorn/prevent-abbreviations */

// old api error kinds
// todo: remove after migration to new error kinds (on backend)
const apiErrorKindOldMap = {
  ACCESS_DENIED: 'access_denied',
  CAPACITY_EXCEEDED: 'capacity_exceeded',
  TOXIC_COMMENT: 'toxic_comment',
  TOXIC_COMMENT_CLASSIFIER_REQUEST_FAILED:
    'toxic_comment_classifier_request_failed',
}
const apiErrorKindMap = {
  INTERNAL_FAILURE: 'internal_failure',
  SYSTEM_ACCESS_DENIED: 'system_access_denied',
  ULMS_INVALID_COMMENT: 'ulms_invalid_comment',
  ULMS_SERVER_CAPACITY_EXCEEDED: 'ulms_server_capacity_exceeded',
  ULMS_TOXIC_COMMENT: 'ulms_toxic_comment',
}
// todo: remove after migration to new error kinds (on backend)
const transformApiErrorKindMap = {
  [apiErrorKindOldMap.ACCESS_DENIED]: apiErrorKindMap.SYSTEM_ACCESS_DENIED,
  [apiErrorKindOldMap.CAPACITY_EXCEEDED]:
    apiErrorKindMap.ULMS_SERVER_CAPACITY_EXCEEDED,
  [apiErrorKindOldMap.TOXIC_COMMENT]: apiErrorKindMap.ULMS_TOXIC_COMMENT,
  [apiErrorKindOldMap.TOXIC_COMMENT_CLASSIFIER_REQUEST_FAILED]:
    apiErrorKindMap.ULMS_INVALID_COMMENT,
}

const decodeErrorKindMap = {
  JSON_PARSE_ERROR: 'json_parse_error',
}

export class UlmsError extends Error {
  constructor(message, options) {
    super(message, options)

    const { isTransient = false } = options || {}

    this.isTransient = isTransient
    this.name = 'UlmsError'
  }

  static get apiErrorKinds() {
    return apiErrorKindMap
  }

  static get decodeErrorKinds() {
    return decodeErrorKindMap
  }

  /**
   * Factory method for creating error instance
   * @param payload {{ kind?: string, isTransient?: boolean }}
   * @returns {UlmsError}
   */
  static fromPayload(payload) {
    const { kind, isTransient } = payload
    // todo: remove after migration to new error kinds (on backend), use kind instead
    const transformedKind = transformApiErrorKindMap[kind] || kind

    return new UlmsError(transformedKind, { isTransient })
  }

  get kind() {
    return this.message
  }
}

// // Error kind matching example
// try {
//   const result = await ulmsClient.createEvent(...)
// } catch (error) {
//   switch (error.kind) {
//     case UlmsError.apiErrorKinds.ACCESS_DENIED: {
//       // show ACCESS_DENIED screen
//       break
//     }
//     case UlmsError.apiErrorKinds.TOXIC_COMMENT: {
//       // show TOXIC_COMMENT screen
//       break
//     }
//     case UlmsError.decodeErrorKinds.JSON_PARSE_ERROR: {
//       // show JSON_PARSE_ERROR screen
//       break
//     }
//     default: {
//       // default
//       sentry.captureException(error)
//       // show default screen
//     }
//   }
// }

export class PresenceError extends Error {
  constructor(message, options) {
    super(message, options)

    const { isTransient = false } = options || {}

    this.isTransient = isTransient
    this.name = 'PresenceError'
  }

  static get apiErrorKinds() {
    return apiErrorKindMap
  }

  static get decodeErrorKinds() {
    return decodeErrorKindMap
  }

  /**
   * Factory method for creating error instance
   * @param payload {{ kind?: string, isTransient?: boolean }}
   * @returns {PresenceError}
   */
  static fromPayload(payload) {
    const { kind, isTransient } = payload
    // todo: remove after migration to new error kinds (on backend), use kind instead
    const transformedKind = transformApiErrorKindMap[kind] || kind

    return new PresenceError(transformedKind, { isTransient })
  }

  get kind() {
    return this.message
  }
}

export class FVSError extends Error {
  constructor(...arguments_) {
    super(...arguments_)

    this.isTransient = false
    this.name = 'FVSError'
  }

  static get decodeErrorKinds() {
    return decodeErrorKindMap
  }
}

export class TenantError extends Error {
  constructor(...arguments_) {
    super(...arguments_)

    this.isTransient = false
    this.name = 'TenantError'
  }

  static get decodeErrorKinds() {
    return decodeErrorKindMap
  }
}

export class NetworkError extends Error {
  constructor(...arguments_) {
    super(...arguments_)

    this.isTransient = true
    this.name = 'NetworkError'
  }
}

export class MQTTClientError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'MQTTClientError'
  }

  static fromError(error) {
    return new MQTTClientError(error.message)
  }
}

export class MQTTRPCServiceError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'MQTTRPCServiceError'
  }
}

export class TimeoutError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'TimeoutError'
  }
}

export class PresenceWsError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'PresenceWsError'
  }

  static get recoverableTypes() {
    return {
      KEEP_ALIVE_TIMED_OUT: 'KEEP_ALIVE_TIMED_OUT', // client-side error
      SERVER_SHUTDOWN: 'SERVER_SHUTDOWN',
      SLOW_CONSUMER: 'SLOW_CONSUMER',
      WS_ERROR: 'WS_ERROR', // client-side error
    }
  }

  static get unrecoverableTypes() {
    return {
      ACCESS_DENIED: 'ACCESS_DENIED',
      INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
      NOT_CONNECTED: 'NOT_CONNECTED', // client-side error

      SESSION_REPLACED: 'SESSION_REPLACED',

      SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR', // client-side error

      // currently unused and commented (todo: comment or remove)
      CONNECT_TIMEOUT: 'CONNECT_TIMEOUT', // ✅
      INVALID_CREDENTIALS: 'INVALID_CREDENTIALS', // ✅
      INVALID_REQUEST: 'INVALID_REQUEST', // ✅
      SESSION_TIMEOUT: 'SESSION_TIMEOUT', // ✅
    }
  }

  static fromType(type) {
    const errorType =
      PresenceWsError.recoverableTypes[type] ||
      PresenceWsError.unrecoverableTypes[type] ||
      PresenceWsError.unrecoverableTypes.UNKNOWN_ERROR

    return new PresenceWsError(errorType)
  }

  static isReplacedError(error) {
    if (!(error instanceof PresenceWsError)) return false

    const { message } = error

    return (
      message === PresenceWsError.unrecoverableTypes.REPLACED ||
      message === PresenceWsError.unrecoverableTypes.SESSION_REPLACED
    )
  }

  isRecoverable() {
    return !!PresenceWsError.recoverableTypes[this.message]
  }
}

export class TokenProviderError extends Error {
  constructor(type, message, cause) {
    super(message)

    this.cause = cause
    this.name = 'TokenProviderError'
    this.type = type
  }

  static get types() {
    return {
      CLIENT_TIMEOUT: 'CLIENT_TIMEOUT',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      NETWORK_ERROR: 'NETWORK_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    }
  }
}
