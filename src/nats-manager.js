/* eslint-disable no-await-in-loop */
import Backoff from './backoff'
import { sleep, timeout } from './common'

class NatsManager {
  constructor(client, gatekeeper, nsm) {
    this.client = client
    this.gatekeeper = gatekeeper
    this.gatekeeperBackoff = new Backoff()
    this.nsm = nsm

    this.forcedStop = false
  }

  async closeConnection() {
    if (!this.client.isClosed()) {
      // close previous connection to NATS
      await this.client.disconnect()
    }
  }

  async retrieveNatsToken(audience, classId) {
    let response

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.nsm.waitOnline()

      try {
        response = await this.gatekeeper.fetchTokenData(audience, classId)
      } catch (error) {
        console.log('[retrieveNatsToken] catch', error) // eslint-disable-line no-console
      }

      if (response) {
        this.gatekeeperBackoff.reset()

        break
      } else {
        await sleep(this.gatekeeperBackoff.value)

        this.gatekeeperBackoff.next()
      }
    }

    return response
  }

  async start(audience, classId, name) {
    this.forcedStop = false

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { expires_in: expiresIn, token } = await this.retrieveNatsToken(
        audience,
        classId
      )

      // setup new connection to NATS
      const closed = this.client.connect({
        classId,
        name,
        token,
      })

      await Promise.race([
        closed,
        this.nsm.waitOffline(),
        timeout((expiresIn - 30) * 1e3),
      ])

      await this.closeConnection()

      if (this.forcedStop) {
        break
      }

      // waiting 2 seconds between reconnections
      await sleep(2e3)
    }
  }

  async stop() {
    this.forcedStop = true

    await this.closeConnection()
  }
}

export default NatsManager
