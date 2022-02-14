import EventEmitter from 'node:events'
import pThrottle from 'p-throttle'

export default class BaseSensor extends EventEmitter {
  static defaults = {
    throttleLimit: 1,
    throttleInterval: 1000,
  }

  constructor(options = {}) {
    super()
    this.options = { ...this.constructor.defaults, ...options }
    this.app = this.options.app
    this.isReady = false
    this.lastReading = null
    this.throttle = pThrottle({ limit: this.options.throttleLimit || 1, interval: this.options.throttleInterval || 1000 })
  }

  initialize() {
    this.isReady = true
    this.read = this.throttle(this._read.bind(this))
    this.emit('ready')
  }

  // Subclasses define this method to do the actual reading
  _read() {
    throw new Error('The _read() method must be defined by Sensor subclass')
  }
}
