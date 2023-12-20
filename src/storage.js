import axios from 'axios'
import mime from 'mime'
import { v4 as uuidV4 } from 'uuid'

const MINIGROUP = 'minigroup'
const P2P = 'p2p'
const WEBINAR = 'webinar'

const appKindEnum = {
  MINIGROUP,
  P2P,
  WEBINAR,
}

const CONTENT = 'content'
const EVENTS = 'eventsdump'
const HLS = 'hls'
const ORIGIN = 'origin'

const bucketKindEnum = {
  CONTENT,
  EVENTS,
  HLS,
  ORIGIN,
}

const STORAGE_SCHEME = 'storage'

const reservedObjectNameEnum = {
  EVENTS_DUMP: 'json',
  // HLS_MANIFEST: (backend) => `long.v2.${backend}.master.m3u8`,
  SOURCE: 'source.webm',
  SUBTITLES: 'transcription.ru.vtt',
}

const objectUrlRegularExpression = /^.*\/api\/(.*)\/sets\/(.*)\/objects\/(.*)$/

class Storage {
  static get appKinds() {
    return appKindEnum
  }

  static get bucketKinds() {
    return bucketKindEnum
  }

  static get scheme() {
    return STORAGE_SCHEME
  }

  static createBucketName(bucketKind, appKind, audience) {
    return `${bucketKind}.${appKind}.${audience}`
  }

  constructor(endpoint, tokenProvider, appKind, audience, backend) {
    this.appKind = appKind
    this.audience = audience
    this.backend = backend
    this.endpoint = endpoint
    this.tokenProvider = tokenProvider
    this.endpointUrl = new URL(this.endpoint)

    this.contentBucket = Storage.createBucketName(
      Storage.bucketKinds.CONTENT,
      this.appKind,
      this.audience
    )
    this.eventsBucket = Storage.createBucketName(
      Storage.bucketKinds.EVENTS,
      this.appKind,
      this.audience
    )
    this.hlsBucket = Storage.createBucketName(
      Storage.bucketKinds.HLS,
      this.appKind,
      this.audience
    )
    this.originBucket = Storage.createBucketName(
      Storage.bucketKinds.ORIGIN,
      this.appKind,
      this.audience
    )
  }

  getObjectUrl(bucket, set, object) {
    return `${this.endpoint}/backends/${this.backend}/sets/${bucket}::${set}/objects/${object}`
  }

  getHLSObjectUrl(set) {
    return this.getObjectUrl(
      this.hlsBucket,
      set,
      `long.v2.${this.backend}.master.m3u8`
    )
  }

  getEventsDumpUrl(set) {
    return this.getObjectUrl(
      this.eventsBucket,
      set,
      reservedObjectNameEnum.EVENTS_DUMP
    )
  }

  getSubtitleObjectUrl(set) {
    return this.getObjectUrl(
      this.hlsBucket,
      set,
      reservedObjectNameEnum.SUBTITLES
    )
  }

  // eslint-disable-next-line class-methods-use-this
  getShortObjectUrl(object) {
    return `${Storage.scheme}://${object}`
  }

  isObjectUrl(url) {
    const matchHost = url.startsWith(this.endpointUrl.origin)
    const matchParameters = url.match(objectUrlRegularExpression)

    return Boolean(matchHost && matchParameters)
  }

  toObjectUrl(url, set) {
    const object = url.replace(`${Storage.scheme}://`, '')

    return this.getObjectUrl(this.contentBucket, set, object)
  }

  // eslint-disable-next-line class-methods-use-this
  isShortObjectUrl(url) {
    return url.startsWith(`${Storage.scheme}://`)
  }

  toShortObjectUrl(url) {
    const result = url.match(objectUrlRegularExpression)

    return this.getShortObjectUrl(result[result.length - 1])
  }

  async sign(parameters) {
    const token = await this.tokenProvider.getToken()
    const url = `${this.endpoint}/backends/${this.backend}/sign`
    const headers = {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    }
    const response = await axios.post(url, parameters, { headers })

    return response.data.uri
  }

  async upload(parameters, data, config) {
    const uri = await this.sign({
      ...parameters,
      method: 'PUT',
    })

    return axios.put(uri, data, {
      ...config,
      headers: parameters.headers,
    })
  }

  async uploadContent(file, set, config) {
    const uuid = uuidV4()
    const { name, type } = file
    const extension = mime.getExtension(type) || name.split('.').slice(-1)[0]
    const bucket = this.contentBucket
    const object = `${uuid}.${extension}`
    const headers = {
      'cache-control': 'max-age=31536000',
      'content-type': type,
    }
    const parameters = {
      headers,
      object,
      set: `${bucket}::${set}`,
    }

    await this.upload(parameters, file, config)

    return this.getObjectUrl(bucket, set, object)
  }
}

export default Storage
