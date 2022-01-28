const EventEmitter = require('events')

class BaseSensor extends EventEmitter {
  static defaults = {}

  constructor(options = {}) {
    this.options = { ...this.constructor.defaults, ...options }
    this.app = this.config.app
    this.name = this.config.name
    this.isReady = false
    this.initialize()
  }

  initialize() {
    this.isReady = true
    this.emit('ready')
  }

  read() {
    throw new Error('The read() method must be defined by Sensor subclass')
  }
}

module.exports = BaseSensor
