import { MQTTRPCService } from '../src/mqtt-rpc'

const mqttClient = {
  connected: true,
  on: jest.fn(),
  off: jest.fn(),
  attachRoute: jest.fn(),
  detachRoute: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn()
}

const handler = jest.fn()

const topicIn = 'topicIn'
const topicOut = 'topicOut'
const codec = {
  encode: jest.fn(),
  decode: jest.fn()
}
const methods = {
  method: jest.fn()
}

const method = 'aaa'
const params = 'bbb'

const options = {
  properties: {
    correlationData: expect.any(String),
    responseTopic: topicIn,
    userProperties: {
      local_timestamp: expect.any(String),
      method: method,
      type: 'request'
    }
  },
  qos: 1
}

const labels = {
  app_audience: 'app_audience',
  app_label: 'app_label',
  app_version: 'app_version',
  scope: 'scope'
}

const optionsWithLabel = {
  ...options,
  properties: {
    ...options.properties,
    userProperties: {
      ...options.properties.userProperties,
      ...labels
    }
  }
}

const serviceMQTTRPC = new MQTTRPCService(mqttClient, topicIn, topicOut, codec, methods)

describe('MQTT-RPC Service is work', () => {
  it('addSubscription works', () => {
    serviceMQTTRPC._addSubscription()
    expect(mqttClient.on).toBeCalledWith('close', expect.any(Function))
    expect(mqttClient.on).toBeCalledWith('connect', expect.any(Function))
    expect(mqttClient.on).toBeCalledTimes(2)
    expect(mqttClient.attachRoute).toBeCalledWith(topicIn, expect.any(Function))
    expect(mqttClient.attachRoute).toBeCalledTimes(1)
  })
  it('removeSubscription works', () => {
    serviceMQTTRPC._removeSubscription()
    expect(mqttClient.off).toBeCalledWith('close', expect.any(Function))
    expect(mqttClient.off).toBeCalledWith('connect', expect.any(Function))
    expect(mqttClient.off).toBeCalledTimes(2)
    expect(mqttClient.detachRoute).toBeCalledWith(topicIn)
    expect(mqttClient.detachRoute).toBeCalledTimes(1)
  })
  it('subscribeIn', () => {
    serviceMQTTRPC._subscribeIn()
    expect(mqttClient.subscribe).toBeCalledWith(topicIn, null, expect.any(Function))
  })
  it.skip('sent() is work', () => {
    serviceMQTTRPC.register(method, handler)
    serviceMQTTRPC.send(method, params)
    expect(mqttClient.publish).toBeCalledWith(topicOut, undefined, expect.objectContaining(options), expect.any(Function))
    expect(codec.encode).toBeCalledWith(params)
  })
  it.skip('Label is set', () => {
    serviceMQTTRPC.setLabels(labels)
    serviceMQTTRPC.send(method, params)
    expect(mqttClient.publish).toBeCalledWith(topicOut, undefined, expect.objectContaining(optionsWithLabel), expect.any(Function))
    expect(codec.encode).toBeCalledWith(params)
  })
  it('Register is work', () => {
    serviceMQTTRPC.register(method, handler)
    serviceMQTTRPC.send(method, params)
    serviceMQTTRPC._processIncomingRequest(options.properties, params)
    expect(handler).toBeCalledWith(params)
  })
})
