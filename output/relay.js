const Base = require('./base')
const { Gpio } = require('onoff')

class Relay extends Base {
  static defaults = {
    onValue: 0,
  }

  get stateMap() {
    return {
      on: this.options.onValue,
      off: this.options.onValue ^ 1,
    }
  }

  constructor(options = {}) {
    super(options)
    this.options = { ...this.constructor.defaults, ...options }
    this.pin = this.options.pin
    this.gpio = new Gpio(this.pin, 'out')
    this.state = this.stateMap.off
  }

  async initialize() {
    await this.setState('off')
    return super.initialize()
  }

  async setState(state) {
    const value = this.stateMap[state]
    const result = await this.gpio.write(value)
    this.state = value
    return result
  }

  reset() {
    return this.setState('off')
  }
}

module.exports = Relay
