const { join } = require('path')
const { readdirSync } = require('fs/promises')
const Sensor = require('./sensor')
const Relay = require('./relay')

class App {
  static defaults = {
    sensorDir: '/sys/bus/w1/devices',
    relays: [],
  }

  constructor(options = {}) {
    this.config = { ...this.constructor.defaults, ...options }
    this.sensors = this.getSensors()
    this.relays = this.config.relays.map((pin) => new Relay(pin))

    this.resetRelays()
  }

  getSensors() {
    const dir = readdirSync(this.config.sensorDir)
    const sensors = dir.reduce((out, child) => {
      if (!child.startsWith('28-')) return out
      out.push(new Sensor(join(this.config.sensorDir, child)))
      return out
    }, [])

    return sensors
  }

  async resetRelays() {
    return Promise.all(this.relays.map((relay) => relay.off()))
  }

  async readSensors() {
    return Promise.all(this.sensors.map((sensor) => sensor.read()))
  }
}

module.exports = App
