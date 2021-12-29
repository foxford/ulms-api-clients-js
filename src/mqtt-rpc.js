/* eslint unicorn/no-null: 1 */
import { v4 as uuid4 } from 'uuid'

import { MQTTClientError, MQTTRPCServiceError } from './error'

class MQTTRPCService {
  constructor(mqttClient, topicIn, topicOut, codec, methods) {
    this.codec = codec
    this.handlerMap = {}
    this.incomingRequestMap = {}
    this.labels = {}
    this.mqtt = mqttClient
    this.methods = methods
    this.publishQoS = 1
    this.requestStorage = {}
    this.topicIn = topicIn
    this.topicOut = topicOut

    this.boundedDiscardAllRequests = this.discardAllRequests.bind(this)
    this.boundedSubscribeIn = this.subscribeIn.bind(this)

    this.subPromise = undefined

    this.addSubscription()

    if (this.mqtt && this.mqtt.connected) {
      this.subscribeIn()
    }
  }

  addSubscription() {
    this.mqtt.on('close', this.boundedDiscardAllRequests)
    this.mqtt.on('connect', this.boundedSubscribeIn)
    this.mqtt.attachRoute(this.topicIn, this.handleMessageEvent.bind(this))
  }

  removeSubscription() {
    this.mqtt.off('close', this.boundedDiscardAllRequests)
    this.mqtt.off('connect', this.boundedSubscribeIn)
    this.mqtt.detachRoute(this.topicIn)
    this.mqtt.unsubscribe(this.topicIn)
  }

  subscribeIn() {
    this.subPromise = new Promise((resolve, reject) => {
      this.mqtt.subscribe(this.topicIn, undefined, (error) => {
        if (error) {
          this.subPromise = undefined

          reject(MQTTClientError.fromError(error))

          return
        }

        this.subPromise = undefined

        resolve()
      })
    })
  }

  handleMessageEvent(topicParameters, topic, message, packet) {
    const payload = this.codec.decode(message)
    const { properties } = packet
    const {
      correlationData,
      userProperties: { label, method, status: s, type },
    } = properties
    const status = Number(s)

    if (type === 'response' && correlationData) {
      if (status >= 200 && status < 300) {
        this.processResponse('resolve', correlationData, payload)
      } else {
        this.processResponse('reject', correlationData, payload, { status })
      }
    } else if (type === 'request' && method && correlationData) {
      this.processIncomingRequest(properties, payload)
    } else if (type === 'event' && typeof label === 'string') {
      this.processNotification(label, payload)
    } else {
      // do nothing
    }
  }

  processBroadcast(topic, label, parameters) {
    if (!this.mqtt.connected) {
      return Promise.reject(
        new MQTTRPCServiceError(`[${label}] Client disconnected`)
      )
    }

    const properties = {
      userProperties: {
        label,
        local_timestamp: Date.now().toString(),
        type: 'event',
        ...this.labels,
      },
    }

    const payload = this.codec.encode(parameters)
    let resolveFunction
    let rejectFunction
    const promise = new Promise((resolve, reject) => {
      resolveFunction = resolve
      rejectFunction = reject
    })

    this.mqtt.publish(
      topic,
      payload,
      { properties, qos: this.publishQoS },
      (error) => {
        if (error) {
          rejectFunction(MQTTClientError.fromError(error))
        } else {
          resolveFunction()
        }
      }
    )

    return promise
  }

  processIncomingRequest(properties, payload) {
    const {
      correlationData,
      responseTopic,
      userProperties: { method },
    } = properties
    const handler = this.handlerMap[method]

    if (handler && !this.incomingRequestMap[correlationData]) {
      this.incomingRequestMap[correlationData] = true

      const result = handler(payload)
      const publishProperties = {
        correlationData,
        userProperties: {
          local_timestamp: Date.now().toString(),
          status: '200',
          type: 'response',
          ...this.labels,
        },
      }

      this.mqtt.publish(responseTopic, this.codec.encode(result), {
        publishProperties,
        qos: this.publishQoS,
      })
    }
  }

  processRequest(method, parameters) {
    if (!this.mqtt.connected) {
      return Promise.reject(
        new MQTTRPCServiceError(`[${method}] Client disconnected`)
      )
    }

    const id = uuid4()
    const properties = {
      correlationData: id,
      responseTopic: this.topicIn,
      userProperties: {
        local_timestamp: Date.now().toString(),
        method,
        type: 'request',
        ...this.labels,
      },
    }

    const payload = this.codec.encode(parameters)
    const promise = new Promise((resolve, reject) => {
      this.requestStorage[id] = {
        method,
        payload,
        resolve,
        reject,
      }
    })

    if (this.subPromise) {
      this.subPromise
        .then(() => this.publish(id, payload, properties))
        .catch((error) => {
          this.processResponse('reject', id, error)
        })
    } else {
      this.publish(id, payload, properties)
    }

    return promise
  }

  processResponse(action, id, response, parameters = {}) {
    const request = this.requestStorage[id]
    const { status } = parameters

    if (request) {
      if (action === 'resolve') {
        request.resolve(response)
      } else {
        request.reject({ response, status })
      }

      delete this.requestStorage[id]
    } else {
      // do nothing
    }
  }

  processNotification(method, parameters) {
    const methodHandler = this.methods[method]

    if (methodHandler && typeof methodHandler === 'function') {
      methodHandler(parameters)
    }
  }

  publish(id, payload, properties) {
    this.mqtt.publish(
      this.topicOut,
      payload,
      { properties, qos: this.publishQoS },
      (error) => {
        if (error) {
          this.processResponse('reject', id, MQTTClientError.fromError(error))
        }
      }
    )
  }

  discardAllRequests() {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(this.requestStorage)) {
      const { method, reject } = this.requestStorage[key]

      reject(new MQTTRPCServiceError(`[${method}] Connection closed`))
    }

    this.requestStorage = {}
  }

  broadcast(topic, label, parameters) {
    return this.processBroadcast(topic, label, parameters)
  }

  send(method, parameters) {
    return this.processRequest(method, parameters)
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

  register(method, handler) {
    if (!this.handlerMap[method]) {
      this.handlerMap[method] = handler
    } else {
      throw new MQTTRPCServiceError(`Method ${method} is already registered`)
    }
  }

  unregister(method) {
    if (this.handlerMap[method]) {
      delete this.handlerMap[method]
    } else {
      throw new MQTTRPCServiceError(`Method ${method} was not registered`)
    }
  }

  destroy() {
    this.removeSubscription()
    this.clearLabels()

    this.handlerMap = {}
    this.incomingRequestMap = {}
    this.requestStorage = {}
    this.subPromise = undefined
  }
}

export default MQTTRPCService
