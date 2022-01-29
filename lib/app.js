const { join } = require('path')
const { readdirSync } = require('fs')
const Sensor = require('../sensor/base')
const Relay = require('../output/relay')
const config = require('./config')
const Rule = require('./rule')

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
    this.timer = null
    this.isReady = false

    this.resetOutputs()
  }

  get isRunning() {
    return Boolean(this.timer)
  }

  async initialize() {
    this.setupSensors()
    this.setupOutputs()
    this.setupRules()
  }

  setupSensors() {
    const sensors = this.config.get('sensors')

    this.sensors = sensors.reduce((out, { name, driver, options }) => {
      if (!name || !driver) {
        this.logger.warn('Skipping sensor without name and/or driver specified', { name, driver, options })
        return out
      }

      const driverClass = this.getDriver('sensor', driver)
      out[name] = new driverClass({ app: this, ...options })
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
      out[name] = new driverClass({ app: this, ...options })
      return out
    }, {})
  }

  setupRules() {
    const rules = this.config.get('rules')
    this.rules = rules.map((rule) => new Rule(rule))
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

  async start() {
    if (!this.isReady) {
      await this.initialize()
    }

    if (this.isRunning) {
      await this.stop()
    }

    this.timer = setInterval(this.tick.bind(this), this.config.get('interval') * 1000)
    this.tick()
  }

  stop() {
    clearInterval(this.timer)
    return this.resetOutputs()
  }

  async resetOutputs() {
    return Promise.all(Object.values(this.outputs).map((output) => output.reset()))
  }

  async readSensors() {
    return Promise.all(Object.values(this.sensors).map((sensor) => sensor.read()))
  }

  async tick() {
    const readings = await this.readSensors()
    this.logger.info('get sensor readings', readings)

    for (let rule of this.rules) {
    }
  }
}

module.exports = App
