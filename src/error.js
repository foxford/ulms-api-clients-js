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

  static get types() {
    return {
      ACCESS_DENIED: 'ACCESS_DENIED',
      AGENT_AUTH_TIMED_OUT: 'AGENT_AUTH_TIMED_OUT',
      AGENT_REPLACED: 'AGENT_REPLACED',
      CONNECTION_FAILED: 'CONNECTION_FAILED',
      DATABASE_QUERY_FAILED: 'DATABASE_QUERY_FAILED',
      NOT_CONNECTED: 'NOT_CONNECTED',
      SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
      UNSUPPORTED_REQUEST: 'UNSUPPORTED_REQUEST',
      WS_ERROR: 'WS_ERROR',
    }
  }

  static fromType(type) {
    const errorType =
      PresenceError.types[type] || PresenceError.types.UNKNOWN_ERROR

    return new PresenceError(errorType)
  }
}

export class TokenProviderError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'TokenProviderError'
  }

  static get types() {
    return {
      CLIENT_TIMEOUT: 'CLIENT_TIMEOUT',
      UNAUTHENTICATED: 'UNAUTHENTICATED',
      NETWORK_ERROR: 'NETWORK_ERROR',
      UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    }
  }

  static fromType(type) {
    const errorType =
      TokenProviderError.types[type] || TokenProviderError.types.UNKNOWN_ERROR

    return new TokenProviderError(errorType)
  }
}
