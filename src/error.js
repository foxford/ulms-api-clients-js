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

  static get kinds() {
    return {
      RECOVERABLE_SESSION_ERROR: 'recoverable_session_error',
      UNRECOVERABLE_SESSION_ERROR: 'unrecoverable_session_error',
    }
  }

  static get recoverableTypes() {
    return {
      PING_TIMED_OUT: 'PING_TIMED_OUT', // client-side error
      SLOW_SUBSCRIBER: 'SLOW_SUBSCRIBER',
      TERMINATED: 'TERMINATED',
    }
  }

  static get unrecoverableTypes() {
    return {
      ACCESS_DENIED: 'ACCESS_DENIED',
      AUTH_TIMED_OUT: 'AUTH_TIMED_OUT',
      INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
      NOT_CONNECTED: 'NOT_CONNECTED', // client-side error
      PONG_TIMED_OUT: 'PONG_TIMED_OUT',
      REPLACED: 'REPLACED',
      SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR', // client-side error
      UNSUPPORTED_REQUEST: 'UNSUPPORTED_REQUEST',
      WS_ERROR: 'WS_ERROR', // client-side error
    }
  }

  static fromType(type) {
    const errorType =
      PresenceError.recoverableTypes[type] ||
      PresenceError.unrecoverableTypes[type] ||
      PresenceError.unrecoverableTypes.UNKNOWN_ERROR

    return new PresenceError(errorType)
  }

  static isRecoverableSessionError(error) {
    const { type } = error

    return type === PresenceError.kinds.RECOVERABLE_SESSION_ERROR
  }

  static isReplacedError(error) {
    if (!(error instanceof PresenceError)) return false

    const { message } = error

    return message === PresenceError.unrecoverableTypes.REPLACED
  }

  static isTerminatedError(error) {
    if (!(error instanceof PresenceError)) return false

    const { message } = error

    return message === PresenceError.recoverableTypes.TERMINATED
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
