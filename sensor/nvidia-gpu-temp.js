const BaseSensor = require('./base')
const { formatNumber, celsiusToFahrenheit } = require('../lib/utils')

class NvidiaGpuTemp extends BaseSensor {
  static defaults = {
    gpu: 0,
    scale: 'F',
  }

  constructor(options = {}) {
    super(options)
    this.initialize()
  }

  async initialize() {
    const { execa } = await import('execa')
    this.exec = execa
    super.initialize()
  }

  async read() {
    const { stdout } = this.exec('nvidia-smi', ['--query-gpu=temperature.gpu', '--format=csv,noheader'])
    const degreesC = parseInt(stdout, 10)
    const result = formatNumber(this.options.scale === 'F' ? celsiusToFahrenheit(degreesC) : degreesC)

    this.lastReading = result
    return result
  }
}
