/* eslint-disable max-classes-per-file, unicorn/prevent-abbreviations */
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

export class PresenceError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'PresenceError'
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
      PresenceError.recoverableTypes[type] ||
      PresenceError.unrecoverableTypes[type] ||
      PresenceError.unrecoverableTypes.UNKNOWN_ERROR

    return new PresenceError(errorType)
  }

  static isReplacedError(error) {
    if (!(error instanceof PresenceError)) return false

    const { message } = error

    return (
      message === PresenceError.unrecoverableTypes.REPLACED ||
      message === PresenceError.unrecoverableTypes.SESSION_REPLACED
    )
  }

  isRecoverable() {
    return !!PresenceError.recoverableTypes[this.message]
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
