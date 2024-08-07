import {
  MQTTClientError,
  MQTTRPCServiceError,
  PresenceWsError,
  TimeoutError,
} from '../src/error'

const clientError = new MQTTClientError('Message')
const presenceWsError = new PresenceWsError('Message')
const serviceError = new MQTTRPCServiceError('Message')
const timeoutError = new TimeoutError('Message')

describe('Custom errors have right titles', () => {
  // MQTTClientError
  it('MQTTClientError name is valid', () => {
    expect(clientError.name).toEqual('MQTTClientError')
  })
  it('MQTTClientError message is valid (default)', () => {
    expect(clientError.message).toEqual('Message')
  })
  it('MQTTClientError message is valid (from error)', () => {
    expect(MQTTClientError.fromError(new Error('Message')).message).toEqual(
      'Message',
    )
  })

  // PresenceError
  it('PresenceError message is valid (`fromType` method)', () => {
    expect(PresenceWsError.fromType('test').message).toEqual('UNKNOWN_ERROR')
  })
  it('PresenceError name is valid', () => {
    expect(presenceWsError.name).toEqual('PresenceWsError')
  })
  it('PresenceError message is valid (default)', () => {
    expect(presenceWsError.message).toEqual('Message')
  })

  // MQTTRPCServiceError
  it('MQTTRPCServiceError name is valid', () => {
    expect(serviceError.name).toEqual('MQTTRPCServiceError')
  })
  it('MQTTRPCServiceError message is valid', () => {
    expect(serviceError.message).toEqual('Message')
  })

  // TimeoutError
  it('TimeoutError name is valid', () => {
    expect(timeoutError.name).toEqual('TimeoutError')
  })
  it('TimeoutError message is valid', () => {
    expect(timeoutError.message).toEqual('Message')
  })
})
