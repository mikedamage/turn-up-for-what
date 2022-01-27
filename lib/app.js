const { join } = require('path')
const { readdirSync } = require('fs')
const Sensor = require('./sensor')
const Relay = require('./relay')

class App {
  static defaults = {
    sensorDir: '/sys/bus/w1/devices',
    relays: [],
    scale: 'F',
    interval: 60, // check sensors every minute
    rules: [],
    logger: null,
  }

  constructor(options = {}) {
    this.config = { ...this.constructor.defaults, ...options }
    this.logger = this.config.logger || require('pino')()
    this.sensors = this.getSensors()
    this.relays = this.config.relays.map((pin) => new Relay(pin))
    this.timer = null

    this.resetRelays()
  }

  get isRunning() {
    return Boolean(this.timer)
  }

  start() {
    if (this.isRunning) {
      this.stop()
    }

    this.timer = setInterval(this.doTemperatureActions.bind(this), this.config.interval * 1000)
    this.doTemperatureActions()
  }

  stop() {
    clearInterval(this.timer)
    return this.resetRelays()
  }

  getSensors() {
    const dir = readdirSync(this.config.sensorDir)
    const sensors = dir.reduce((out, child) => {
      if (!child.startsWith('28-')) return out
      out.push(new Sensor(join(this.config.sensorDir, child), { scale: this.config.scale }))
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

  async doTemperatureActions() {
    const readings = await this.readSensors()
    console.log('Temp sensor readings for %s: %O', Date.now(), readings)
  }
}

module.exports = App
