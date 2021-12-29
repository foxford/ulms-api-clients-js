// import { describe, it, expect} from 'jest'

import { MQTTClientError, MQTTRPCServiceError, TimeoutError } from '../src/error'

const clientError = new MQTTClientError('Message')
const serviceError = new MQTTRPCServiceError('Message')
const timeoutError = new TimeoutError('Message')

describe('Custom errors have right titles', () => {
  it('MQTTClientError name is valid', () => {
    expect(clientError.name).toEqual('MQTTClientError')
  })
  it('MQTTClientError message is valid (default)', () => {
    expect(clientError.message).toEqual('Message')
  })
  it('MQTTClientError message is valid (from error)', () => {
    expect(MQTTClientError.fromError(new Error('Message')).message).toEqual('Message')
  })
  it('MQTTRPCServiceError name is valid', () => {
    expect(serviceError.name).toEqual('MQTTRPCServiceError')
  })
  it('MQTTRPCServiceError message is valid', () => {
    expect(serviceError.message).toEqual('Message')
  })
  it('TimeoutError name is valid', () => {
    expect(timeoutError.name).toEqual('TimeoutError')
  })
  it('TimeoutError message is valid', () => {
    expect(timeoutError.message).toEqual('Message')
  })
})
