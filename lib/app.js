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
      sensor: {},
      output: {},
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
    this.sensors = this._setupDrivers('sensor', sensors)
  }

  setupOutputs() {
    const outputs = this.config.get('outputs')
    this.outputs = this._setupDrivers('output', outputs)
  }


  _setupDrivers(type, list = []) {
    return list.reduce((out, { name, driver, options }) => {
      if (!name || !driver) {
        return out
      }

      const driverClass = this.getDriver(type, driver)
      out[name] = new driverClass({ app: this, ...options })
      return out
    }, {})
  }

  setupRules() {
    const rules = this.config.get('rules')
    this.rules = rules.map((rule) => new Rule(rule))
  }

  getDriver(type, name) {
    if (this.drivers[type][name]) return this.drivers[type][name]
    let driver

    try {
      driver = require(join(__dirname, `../${type}/${name}`))
    } catch (e) {
      driver = require(name)
    }

    this.drivers[type][name] = driver
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

  async readSensor(name) {
    return this.sensors[name].read()
  }

  async readSensors() {
    return Promise.all(Object.values(this.sensors).map((sensor) => sensor.read()))
  }

  async setOutput(name, state) {
    // fixme - this works ok flr on/off, but would be awkward
    // for more complex state management
    this.outputs[name][state]()
  }

  async tick() {
    const readings = await this.readSensors()
    this.logger.info('get sensor readings', readings)

    for (let rule of this.rules) {
    }
  }
}

module.exports = App
