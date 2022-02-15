import Base from './base.js'
import { isRelativeNumber } from '../lib/utils.js'
import { execa } from 'execa'

export default class NvidiaGpuPower extends Base {
  static defaults = {
    id: 0,
    max: 230,
    min: 150,
  }

  constructor(options = {}) {
    super(options)
  }

  async initialize() {
    this.originalLevel = await this.getCurrentPowerLimit()
    this.state = this.originalLevel
    return super.initialize()
  }

  async getCurrentPowerLimit() {
    const { stdout } = await execa('nvidia-smi', ['--query-gpu=power.limit', '--format=csv,noheader'])
    return parseFloat(stdout.trim())
  }

  async setState(powerLevel) {
    let absLevel = isRelativeNumber(powerLevel) ? parseFloat(this.state) + parseFloat(powerLevel) : powerLevel

    if (absLevel > this.options.max) {
      this.app.logger.warn('setting power to max of %s instead of %s', this.options.max, absLevel)
      absLevel = this.options.max
    } else if (absLevel < this.options.min) {
      this.app.logger.warn('setting power to min of %s instead of %s', this.options.max, absLevel)
      absLevel = this.options.min
    }

    try {
      await execa('nvidia-smi', ['-pl', absLevel])
      this.state = absLevel
      this.app.logger.info('Successfully set GPU power level to %s', absLevel)
    } catch (err) {
      this.app.logger.error('Error setting GPU power level: %O', err)
    }
  }

  async reset() {
    return this.setState(this.originalLevel)
  }
}
