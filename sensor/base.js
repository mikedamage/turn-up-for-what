import EventEmitter from 'node:events'

export default class BaseSensor extends EventEmitter {
  static defaults = {}

  constructor(options = {}) {
    super()
    this.options = { ...this.constructor.defaults, ...options }
    this.app = this.options.app
    this.isReady = false
    this.lastReading = null
  }

  initialize() {
    this.isReady = true
    this.emit('ready')
  }

  read() {
    throw new Error('The read() method must be defined by Sensor subclass')
  }

  // TODO: Add debouncing and other utility methods in the base class
}
