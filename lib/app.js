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
    this.timers = []
    this.rules = []
    this.rulesByInterval = {}
    this.isReady = false

    this.resetOutputs()
  }

  get isRunning() {
    return Boolean(this.timers.length)
  }

  async initialize() {
    this.logger.info('Initializing')
    this.setupSensors()
    this.setupOutputs()
    this.setupRules()
    this.isReady = true
  }

  setupSensors() {
    const sensors = this.config.get('sensors')
    this.sensors = this._setupDrivers('sensor', sensors)
    this.logger.info('setup sensors', Object.keys(this.sensors))
  }

  setupOutputs() {
    const outputs = this.config.get('outputs')
    this.outputs = this._setupDrivers('output', outputs)
    this.logger.info('setup outputs', Object.keys(this.outputs))
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
    this.rulesByInterval = this.rules.reduce((obj, rule) => {
      if (!obj[rule.interval]) obj[rule.interval] = []

      obj[rule.interval].push(rule)
      return obj
    }, {})
    this.logger.info('setup monitoring rules', this.rules)
    this.logger.info('consolidate rules into interval grouos', { count: Object.keys(this.rulesByInterval).length })
  }

  getDriver(type, name) {
    if (this.drivers[type][name]) return this.drivers[type][name]
    let driver

    try {
      driver = require(join(__dirname, '..', type, name))
    } catch (e) {
      driver = require(name)
    }

    this.drivers[type][name] = driver
    return driver
  }

  async start() {
    this.logger.info('start monitoring')

    if (!this.isReady) {
      await this.initialize()
    }

    if (this.isRunning) {
      await this.stop()
    }

    this.timers = Object.entries(this.rulesByInterval).map(([interval, rules]) => {
      const handler = async () => {
        for (let rule of rules) {
          const reading = await this.readSensor(rule.sensor)
          this.logger.info('Read sensor', {
            sensor: rule.sensor,
            reading,
          })

          if (!rule.matches(reading)) {
            this.logger.info('rule not triggered')
            continue
          }

          this.logger.info('rule triggeted, setting output state', rule.action)
          this.setOutput(rule.action.output, rule.action.state)
        }
      }

      if (rule.immediate) {
        this.logger.info('triggering rule immediately on start', rule)
        handler()
      }

      return setInterval(handler, rule.interval)
    })
  }

  stop() {
    this.logger.info('stop monitoring')

    for (let timer of this.timers) {
      clearInterval(timer)
    }
    this.timers = []
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
    this.logger.info('set output state', { name, state })
    this.outputs[name][state]()
  }
}

module.exports = App
