const { join } = require('path')
const { readdirSync } = require('fs')
const Sensor = require('../sensor/base')
const config = require('./config')
const Rule = require('./rule')
const { unique, pick } = require('./utils')

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

  initialize() {
    if (this.isReady) return true

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

  setupRules() {
    const rules = this.config.get('rules')

    this.rules = rules.map((rule) => new Rule(rule))
    this.rulesByInterval = this.rules.reduce((obj, rule) => {
      if (!obj[rule.interval]) obj[rule.interval] = []

      obj[rule.interval].push(rule)
      return obj
    }, {})
    this.logger.info('setup monitoring rules: %o', this.rules)
    this.logger.info('consolidate rules into %s interval groups', Object.keys(this.rulesByInterval).length)
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

    if (!this.isReady) this.initialize()

    if (this.isRunning) await this.stop()

    this._createTimers()
  }

  stop() {
    this.logger.info('stop monitoring')

    for (let timer of this.timers) {
      clearInterval(timer)
    }
    this.timers = []
    return this.resetOutputs()
  }

  _createTimers() {
    this.timers = []

    for (let [interval, rules] of Object.entries(this.rulesByInterval)) {
      const handler = async () => {
        // Get a deduplicated list of sensors to read so that they're only read once each interval
        const readings = await this._readRuleSensors(rules)

        for (let rule of rules) {
          if (!rule.matches(readings[rule.sensor])) {
            this.logger.info(
              'sensor reading %s does not match rule threshold of %s. resetting to initial value.',
              readings[rule.sensor],
              rule.threshold,
            )
            await this.outputs[rule.action.output].reset()
            continue
          }

          this.logger.info('rule matched - sensor %s value is %s', rule.sensor, readings[rule.sensor])

          await this.setOutput(rule.action.output, rule.action.state)
        }
      }

      handler()

      this.timers.push(setInterval(handler, interval))
    }
  }

  async _readRuleSensors(rules) {
    const sensorNames = unique(pick(rules, 'sensor'))
    const readings = {}

    for (let name of sensorNames) {
      readings[name] = await this.readSensor(name)
    }

    return readings
  }

  async resetOutputs() {
    return Promise.allSettled(Object.values(this.outputs).map((output) => output.reset()))
  }

  async readSensor(name) {
    return this.sensors[name].read()
  }

  async readSensors() {
    return Promise.allSettled(Object.values(this.sensors).map((sensor) => sensor.read()))
  }

  async setOutput(name, state) {
    // fixme - this works ok for on/off, but would be awkward
    // for more complex state management
    this.logger.info('set output state %O', { name, state })
    this.outputs[name][state]()
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
}

module.exports = App
