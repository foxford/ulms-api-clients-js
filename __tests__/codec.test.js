import { Codec } from '../src/codec'

const encoder = (data) => JSON.stringify(data)
const decoder = (data) => {
  let payload

  try {
    payload = JSON.parse(data.toString())
  } catch (error) {
    payload = {}
  }

  return payload
}

const codec = new Codec(encoder, decoder)
const payload = {
  data: {
    a: 'a',
    b: 'b',
    c: 'c'
  },
  another: [
    'a', 'b', 'c'
  ]
}

describe('Codec works correctly', () => {
  it('Encode works', () => {
    expect(codec.encode(payload)).toEqual(encoder(payload))
  })
  it('Decode works', () => {
    expect(codec.decode(encoder(payload))).toEqual(payload)
  })
})
