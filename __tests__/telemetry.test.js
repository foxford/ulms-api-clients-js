import Telemetry from '../src/telemetry'

const mqttClient = {
  connected: true,
  publish: jest.fn(),
}
const mqttClientDisconnected = {
  connected: false,
  publish: jest.fn(),
}

const agentId = 123
const appName = 'Test'
const topicOut = `agents/${agentId}/api/v1/out/${appName}`
const telemetry = new Telemetry(mqttClient, agentId, appName)
const disconnectedTelemetry = new Telemetry(
  mqttClientDisconnected,
  agentId,
  appName
)
const options = {
  properties: {
    userProperties: {
      label: 'metric.create',
      local_timestamp: expect.any(String),
      type: 'event',
    },
  },
  qos: 1,
}

const optionsWithLabel = {
  properties: {
    userProperties: {
      app_audience: 'app_audience',
      app_label: 'app_label',
      app_version: 'app_version',
      label: 'metric.create',
      local_timestamp: expect.any(String),
      scope: 'scope',
      type: 'event',
    },
  },
  qos: 1,
}

const labels = {
  app_audience: 'app_audience',
  app_label: 'app_label',
  app_version: 'app_version',
  scope: 'scope',
}

describe('Telemetry works', () => {
  it('It works', () => {
    telemetry.send('aaa')
    expect(mqttClient.publish).toBeCalledWith(
      topicOut,
      '"aaa"',
      expect.objectContaining(options)
    )
  })
  it('Label is setting', () => {
    telemetry.setLabels(labels)
    telemetry.send('bbb')
    expect(mqttClient.publish).toBeCalledWith(
      topicOut,
      '"bbb"',
      expect.objectContaining(optionsWithLabel)
    )
  })
  it('Label is deleted', () => {
    telemetry.clearLabels()
    telemetry.send('ccc')
    expect(mqttClient.publish).toBeCalledWith(
      topicOut,
      '"ccc"',
      expect.objectContaining(options)
    )
  })
  it('It will destroy', () => {
    telemetry.setLabels(labels)
    telemetry.send('ddd')
    expect(mqttClient.publish).toBeCalledWith(
      topicOut,
      '"ddd"',
      expect.objectContaining(optionsWithLabel)
    )
    telemetry.destroy()
    telemetry.send('eee')
    expect(mqttClient.publish).toBeCalledWith(
      topicOut,
      '"eee"',
      expect.objectContaining(options)
    )
  })
  it('Handle MQTT disconnected', () => {
    disconnectedTelemetry.send('fff')
    expect(mqttClientDisconnected.publish).toBeCalledTimes(0)
  })
})
