const { Gpio } = require('onoff')

class Relay {
  static defaults = {
    onValue: 0,
  }

  constructor(pin, options = {}) {
    this.config = { ...this.constructor.defaults, ...options }
    this.pin = pin
    this.gpio = new Gpio(this.pin, 'out')
    this.isOn = false

    this.off()
  }

  async off() {
    const result = await this.gpio.write(this.config.onValue ^ 1)
    this.isOn = false
    return result
  }

  async on() {
    const result = await this.gpio.write(this.config.onValue)
    this.isOn = true
    return result
  }
}

module.exports = Relay
