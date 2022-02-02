const Base = require('./base')
const { Gpio } = require('onoff')

class Relay extends Base {
  static defaults = {
    onValue: 0,
  }

  constructor(options = {}) {
    super(options)
    this.options = { ...this.constructor.defaults, ...options }
    this.pin = this.options.pin
    this.gpio = new Gpio(this.pin, 'out')

    this.initialize()
  }

  async initialize() {
    await this.off()
    super.initialize()
  }

  async off() {
    const result = await this.gpio.write(this.options.onValue ^ 1)
    this.state = 'off'
    return result
  }

  async on() {
    const result = await this.gpio.write(this.options.onValue)
    this.state = 'on'
    return result
  }

  reset() {
    return this.off()
  }
}

module.exports = Relay
