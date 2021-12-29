class Codec {
  constructor(encoder, decoder) {
    this.encoder = encoder
    this.decoder = decoder
  }

  encode(data) {
    return this.encoder(data)
  }

  decode(data) {
    return this.decoder(data)
  }
}

export default Codec
