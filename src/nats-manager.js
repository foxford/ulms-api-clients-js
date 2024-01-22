/* eslint-disable no-await-in-loop */
import Backoff from './backoff'
import { sleep, timeout } from './common'

class NatsManager {
  constructor(client, gatekeeper, nsm, vsm) {
    this.client = client
    this.gatekeeper = gatekeeper
    this.gatekeeperBackoff = new Backoff()
    this.nsm = nsm // NetworkStatusMonitor instance
    this.vsm = vsm // VisibilityStateMonitor instance

    this.forcedStop = false
  }

  async closeConnection() {
    if (!this.client.isClosed()) {
      // close previous connection to NATS
      await this.client.disconnect()
    }
  }

  async retrieveNatsToken(classId) {
    let response

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.nsm.waitOnline()

      try {
        response = await this.gatekeeper.fetchTokenData(classId)
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

  async start(classId, name, accountLabel) {
    this.forcedStop = false

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { expires_in: expiresIn, token } = await this.retrieveNatsToken(
        classId
      )

      // setup new connection to NATS
      const closed = this.client.connect({
        accountLabel,
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

      // eslint-disable-next-line unicorn/prefer-ternary
      if (this.vsm && this.vsm.isHidden()) {
        await this.vsm.waitVisible()
      } else {
        // waiting 2 seconds between reconnections
        await sleep(2e3)
      }
    }
  }

  async stop() {
    this.forcedStop = true

    await this.closeConnection()
  }
}

export default NatsManager
