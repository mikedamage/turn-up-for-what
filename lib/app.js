import { fileURLToPath } from 'node:url'
import { join, resolve, dirname } from 'node:path'
import Rule from './rule.js'
import { unique, pick } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default class App {
  constructor(options = {}) {
    this.config = options.config
    this.logger = options.logger
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
    if (this.isReady) return true

    this.logger.info('Initializing')

    await this.setupSensors()
    await this.setupOutputs()
    this.setupRules()
    this.isReady = true
  }

  async setupSensors() {
    const sensors = this.config.get('sensors')
    this.sensors = await this._setupDrivers('sensor', sensors)
    this.logger.info('setup sensors', Object.keys(this.sensors))
  }

  async setupOutputs() {
    const outputs = this.config.get('outputs')
    this.outputs = await this._setupDrivers('output', outputs)
    await Promise.allSettled(Object.values(this.outputs).map((output) => output.initialize()))
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

  async getDriver(type, name) {
    if (this.drivers[type][name]) return this.drivers[type][name]
    let driver
    const driverPath = resolve(__dirname, '..', type, `${name}.js`)
    this.logger.info('look for driver of type %s: %s at %s', type, name, driverPath)

    try {
      driver = (await import(driverPath)).default
    } catch (e) {
      driver = await import(name)
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

  pause() {
    this.logger.info('pause monitoring')
    this._clearTimers()
  }

  stop() {
    this.logger.info('stop monitoring')

    this._clearTimers()
    return this.resetOutputs()
  }

  _clearTimers() {
    for (let timer of this.timers) {
      clearInterval(timer)
    }
    this.timers = []
  }

  _createTimers() {
    this.timers = []

    for (let [interval, rules] of Object.entries(this.rulesByInterval)) {
      const handler = async () => {
        // Get a deduplicated list of sensors to read so that they're only read once each interval
        const readings = await this._readRuleSensors(rules)

        for (let rule of rules) {
          if (!rule.matches(readings[rule.sensor])) {
            this.logger.info('sensor reading %s does not match rule threshold or %s', readings[rule.sensor],
              rule.threshold)

            if (rule.resetWhenNegative) {
              this.logger.info('resetting output to default value')
              await this.outputs[rule.action.output].reset()
            }

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
    this.logger.info('set output state %O', { name, state })
    return this.outputs[name].setState(state)
  }

  async _setupDrivers(type, list = []) {
    return list.reduce(async (out, { name, driver, options }) => {
      if (!name || !driver) {
        return out
      }

      const driverClass = await this.getDriver(type, driver)
      out[name] = new driverClass({ app: this, ...options })
      return out
    }, {})
  }
}
