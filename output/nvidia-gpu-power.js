import Base from './base.js'
import { isRelativeNumber } from '../lib/utils.js'
import { execa } from 'execa'

export default class NvidiaGpuPower extends Base {
  static defaults = {
    id: 0,
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
    const absLevel = isRelativeNumber(powerLevel) ? this.state + parseFloat(powerLevel) : powerLevel

    try {
      await execa('nvidia-smi', ['-pl', absLevel])
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
