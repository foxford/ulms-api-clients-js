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
      RECOVERABLE_SESSION_ERROR: 'recoverable_session_error', // only TERMINATED
      UNRECOVERABLE_SESSION_ERROR: 'unrecoverable_session_error', // all other
    }
  }

  static get types() {
    return {
      ACCESS_DENIED: 'ACCESS_DENIED',
      AUTH_TIMED_OUT: 'AUTH_TIMED_OUT',
      CONNECTION_FAILED: 'CONNECTION_FAILED',
      INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
      NOT_CONNECTED: 'NOT_CONNECTED',
      PONG_TIMED_OUT: 'PONG_TIMED_OUT',
      REPLACED: 'REPLACED',
      SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
      TERMINATED: 'TERMINATED',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      WS_ERROR: 'WS_ERROR',
    }
  }

  static fromType(type) {
    const errorType =
      PresenceError.types[type] || PresenceError.types.UNKNOWN_ERROR

    return new PresenceError(errorType)
  }

  static isRecoverableSessionError(error) {
    const { type } = error

    return type === PresenceError.kinds.RECOVERABLE_SESSION_ERROR
  }

  static isReplacedError(error) {
    if (!(error instanceof PresenceError)) return false

    const { message } = error

    return message === PresenceError.types.REPLACED
  }

  static isTerminatedError(error) {
    if (!(error instanceof PresenceError)) return false

    const { message } = error

    return message === PresenceError.types.TERMINATED
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
