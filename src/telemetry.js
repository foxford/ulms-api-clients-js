import Codec from './codec'

class Telemetry {
  constructor(mqttClient, agentId, appName) {
    this.agentId = agentId
    this.appName = appName
    this.labels = {}
    this.publishQoS = 1
    this.topicOut = `agents/${this.agentId}/api/v1/out/${this.appName}`
    this.mqtt = mqttClient

    this.codec = new Codec(
      (data) => JSON.stringify(data),
      (_) => _
    )
  }

  send(parameters) {
    if (!this.mqtt.connected) {
      return
    }

    const properties = {
      userProperties: {
        label: 'metric.create',
        local_timestamp: Date.now().toString(),
        type: 'event',
        ...this.labels,
      },
    }

    this.mqtt.publish(this.topicOut, this.codec.encode(parameters), {
      properties,
      qos: this.publishQoS,
    })
  }

  setLabels(labels) {
    const { app_audience, app_label, app_version, scope } = labels // eslint-disable-line camelcase

    this.labels = {
      ...(app_audience !== undefined && { app_audience }), // eslint-disable-line camelcase
      ...(app_label !== undefined && { app_label }), // eslint-disable-line camelcase
      ...(app_version !== undefined && { app_version }), // eslint-disable-line camelcase
      ...(scope !== undefined && { scope }),
    }
  }

  clearLabels() {
    this.labels = {}
  }

  destroy() {
    this.clearLabels()
  }
}

export default Telemetry
