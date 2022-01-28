const { join } = require('path')
const { readdirSync } = require('fs')
const Sensor = require('../sensor/base')
const Relay = require('./relay')
const config = require('./config')

class App {
  constructor(options = {}) {
    this.config = config.validate()
    this.logger = options.logger || require('pino')()
    this.drivers = {
      sensor: new Map(),
      output: new Map(),
    }
    this.sensors = {}
    this.outputs = {}
    this.relays = this.config.get('relays').map((pin) => new Relay(pin))
    this.timer = null
    this.isReady = false

    this.resetRelays()
  }

  get isRunning() {
    return Boolean(this.timer)
  }

  async initialize() {
    this.setupSensors()
    this.setupOutputs()
  }

  setupSensors() {
    const sensors = this.config.get('sensors')

    this.sensors = sensors.reduce((out, { name, driver, options }) => {
      if (!name || !driver) {
        this.logger.warn('Skipping sensor without name and/or driver specified', { name, driver, options })
        return out
      }

      const driverClass = this.getDriver('sensor', driver)
      out[name] = new driverClass(options)
      return out
    }, {})
  }

  setupOutputs() {
    const outputs = this.config.get('outputs')

    this.outputs = outputs.reduce((out, { name, driver, options }) => {
      if (!name || !driver) {
        this.logger.warn('Skipping output without name and/or driver specified', { name, driver, options })
        return out
      }

      const driverClass = this.getDriver('output', driver)
      out[name] = new driverClass(options)
      return out
    }, {})
  }

  getDriver(type, name) {
    if (this.drivers[type].has(name)) return this.drivers[type].get(name)
    let driver

    try {
      driver = require(join(__dirname, `../${type}/${name}`))
    } catch (e) {
      driver = require(name)
    }

    this.drivers[type].set(name, driver)
    return driver
  }

  hasBuiltInSensor(name) {}

  async start() {
    if (!this.isReady) {
      await this.initialize()
    }

    if (this.isRunning) {
      await this.stop()
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
