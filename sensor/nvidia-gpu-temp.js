import BaseSensor from './base.js'
import { formatNumber, celsiusToFahrenheit } from '../lib/utils.js'
import { execa } from 'execa'

export default class NvidiaGpuTemp extends BaseSensor {
  static defaults = {
    gpu: 0,
    scale: 'C',
  }

  constructor(options = {}) {
    super(options)
    this.initialize()
  }

  async read() {
    const { stdout } = await execa('nvidia-smi', ['--query-gpu=temperature.gpu', '--format=csv,noheader'])
    this.app.logger.info('gpu temp reading: %O', stdout)
    const degreesC = parseInt(stdout.trim(), 10)
    const result = formatNumber(this.options.scale === 'F' ? celsiusToFahrenheit(degreesC) : degreesC)

    this.lastReading = result
    return result
  }
}
