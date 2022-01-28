const EventEmitter = require('events')

class BaseOutput extends EventEmitter {
  constructor(options = {}) {
    super()
    this.options = {...this.constructor.defaults, options}
    this.app = this.options.app
    this.isReady = false
  }

  initialize() {
    this.isReady = true
    this.emit('ready')
  }

  on() {
    throw new Error('The on() method must be defined by Output subclass')
  }

  off() {
    throw new Error('The off() method must be defined by Output subclass')
  }

  reset() {
    throw new Error('The reset() method must be defined by Output subclass')
  }
}

module.exports = BaseOutput