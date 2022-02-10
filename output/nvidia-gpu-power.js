const Base = require('./base')
const {isRelativeNumber} = require('../lib/utils')

class NvidiaGpuPower extends Base {
  static defaults = {
    id: 0,
  }

  constructor(options = {}) {
    super(options)
  }

  async initialize() {
    const {execa} = await import('execa')
    this.exec = execa
    this.originalLevel = await this.getCurrentPowerLimit()
    this.state = this.originalLevel
    return super.initialize()
  }

  async getCurrentPowerLimit() {
    const {stdout} = await this.exec('nvidia-smi', ['--query-gpu=power.limit', '--format=csv,noheader'])
    return parseFloat(stdout.trim())
  }

  async setState(powerLevel) {
    const absLevel = isRelativeNumber(powerLevel) ? this.state + parseFloat(powerLevel) : powerLevel

    try {
      await this.exec('nvidia-smi', ['-pl', absLevel])
      this.state = absLevel
      this.app.logger('Successfully set GPU power level to %s', absLevel)
    } catch (err) {
      this.app.error('Error setting GPU power level: %O', err)
    }
  }

  async reset() {
    return this.setState(this.originalLevel)
  }
}

module.exports = NvidiaGpuPower