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
    return this.gpio.write(this.config.onValue ^ 1)
  }

  on() {
    return this.gpio.write(this.config.onValue)
  }
}

module.exports = Relay