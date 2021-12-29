/* eslint-disable camelcase */
import { v4 as uuid4 } from 'uuid'

import { MQTTClientError, MQTTRPCServiceError } from './error'

class MQTTRPCService {
  constructor (mqttClient, topicIn, topicOut, codec, methods) {
    this._codec = codec
    this._handlerMap = {}
    this._incomingRequestMap = {}
    this._labels = {}
    this._mqtt = mqttClient
    this._methods = methods
    this._publishQoS = 1
    this._requestStorage = {}
    this._topicIn = topicIn
    this._topicOut = topicOut

    this._boundedDiscardAllRequests = this._discardAllRequests.bind(this)
    this._boundedSubscribeIn = this._subscribeIn.bind(this)

    this._subPromise = null

    this._addSubscription()

    if (this._mqtt && this._mqtt.connected) {
      this._subscribeIn()
    }
  }

  _addSubscription () {
    this._mqtt.on('close', this._boundedDiscardAllRequests)
    this._mqtt.on('connect', this._boundedSubscribeIn)
    this._mqtt.attachRoute(this._topicIn, this._handleMessageEvent.bind(this))
  }

  _removeSubscription () {
    this._mqtt.off('close', this._boundedDiscardAllRequests)
    this._mqtt.off('connect', this._boundedSubscribeIn)
    this._mqtt.detachRoute(this._topicIn)
    this._mqtt.unsubscribe(this._topicIn)
  }

  _subscribeIn () {
    this._subPromise = new Promise((resolve, reject) => {
      this._mqtt.subscribe(this._topicIn, null, (error) => {
        if (error) {
          this._subPromise = null

          reject(MQTTClientError.fromError(error))

          return
        }

        this._subPromise = null

        resolve()
      })
    })
  }

  _handleMessageEvent (topicParams, topic, message, packet) {
    const payload = this._codec.decode(message)
    const { properties } = packet
    const { correlationData, userProperties: { label, method, status: s, type } } = properties
    const status = Number(s)

    if (type === 'response' && correlationData) {
      if (status >= 200 && status < 300) {
        this._processResponse('resolve', correlationData, payload)
      } else {
        this._processResponse('reject', correlationData, payload, { status })
      }
    } else if (type === 'request' && method && correlationData) {
      this._processIncomingRequest(properties, payload)
    } else if (type === 'event' && typeof label === 'string') {
      this._processNotification(label, payload)
    } else {
      // do nothing
    }
  }

  _processBroadcast (topic, label, params) {
    if (!this._mqtt.connected) {
      return Promise.reject(new MQTTRPCServiceError(`[${label}] Client disconnected`))
    }

    const properties = {
      userProperties: {
        label,
        local_timestamp: Date.now().toString(),
        type: 'event',
        ...this._labels
      }
    }

    const payload = this._codec.encode(params)
    let resolveFn
    let rejectFn
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve
      rejectFn = reject
    })

    this._mqtt.publish(
      topic,
      payload,
      { properties, qos: this._publishQoS },
      (error) => {
        if (error) {
          rejectFn(MQTTClientError.fromError(error))
        } else {
          resolveFn()
        }
      }
    )

    return promise
  }

  _processIncomingRequest (properties, payload) {
    const { correlationData, responseTopic, userProperties: { method } } = properties
    const handler = this._handlerMap[method]

    if (handler && !this._incomingRequestMap[correlationData]) {
      this._incomingRequestMap[correlationData] = true

      const result = handler(payload)
      const properties = {
        correlationData,
        userProperties: {
          local_timestamp: Date.now().toString(),
          status: '200',
          type: 'response',
          ...this._labels
        }
      }

      this._mqtt.publish(responseTopic, this._codec.encode(result), { properties, qos: this._publishQoS })
    }
  }

  _processRequest (method, params) {
    if (!this._mqtt.connected) {
      return Promise.reject(new MQTTRPCServiceError(`[${method}] Client disconnected`))
    }

    const id = uuid4()
    const properties = {
      correlationData: id,
      responseTopic: this._topicIn,
      userProperties: {
        local_timestamp: Date.now().toString(),
        method,
        type: 'request',
        ...this._labels
      }
    }

    const payload = this._codec.encode(params)
    const promise = new Promise((resolve, reject) => {
      this._requestStorage[id] = {
        method,
        payload,
        resolve,
        reject
      }
    })

    const publish = (id, payload, properties) => this._mqtt.publish(
      this._topicOut,
      payload,
      { properties, qos: this._publishQoS },
      (error) => {
        if (error) {
          this._processResponse('reject', id, MQTTClientError.fromError(error))
        }
      }
    )

    if (this._subPromise) {
      this._subPromise
        .then(() => {
          publish(id, payload, properties)
        })
        .catch((error) => {
          this._processResponse('reject', id, error)
        })
    } else {
      publish(id, payload, properties)
    }

    return promise
  }

  _processResponse (action, id, response, params = {}) {
    const request = this._requestStorage[id]
    const { status } = params

    if (request) {
      if (action === 'resolve') {
        request.resolve(response)
      } else {
        request.reject({ response, status })
      }

      delete this._requestStorage[id]
    } else {
      // do nothing
    }
  }

  _processNotification (method, params) {
    const methodHandler = this._methods[method]

    if (methodHandler && typeof methodHandler === 'function') {
      methodHandler(params)
    }
  }

  _discardAllRequests () {
    Object.keys(this._requestStorage).forEach((key) => {
      const { method, reject } = this._requestStorage[key]

      reject(new MQTTRPCServiceError(`[${method}] Connection closed`))
    })

    this._requestStorage = {}
  }

  broadcast (topic, label, params) {
    return this._processBroadcast(topic, label, params)
  }

  send (method, params) {
    return this._processRequest(method, params)
  }

  setLabels (labels) {
    const {
      app_audience,
      app_label,
      app_version,
      scope
    } = labels

    this._labels = {
      ...(app_audience !== undefined && { app_audience }),
      ...(app_label !== undefined && { app_label }),
      ...(app_version !== undefined && { app_version }),
      ...(scope !== undefined && { scope })
    }
  }

  clearLabels () {
    this._labels = {}
  }

  register (method, handler) {
    if (!this._handlerMap[method]) {
      this._handlerMap[method] = handler
    } else {
      throw new MQTTRPCServiceError(`Method ${method} is already registered`)
    }
  }

  unregister (method) {
    if (this._handlerMap[method]) {
      delete this._handlerMap[method]
    } else {
      throw new MQTTRPCServiceError(`Method ${method} was not registered`)
    }
  }

  destroy () {
    this._removeSubscription()
    this.clearLabels()

    this._handlerMap = {}
    this._incomingRequestMap = {}
    this._requestStorage = {}
    this._subPromise = null
  }
}

export { MQTTRPCService }
