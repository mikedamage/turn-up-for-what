const { readFile } = require('fs/promises')
const { join, isAbsolute } = require('path')
const BaseSensor = require('./base')

/**
 * Class for reading values from a DS18B20 temperature sensor
 */
class DS18B20 extends BaseSensor {
  static defaults = {
    scale: 'F',
    basePath: '/sys/bus/w1/devices',
  }

  constructor(options = {}) {
    super(options)
    this.path = join(this.options.basePath, this.options.path)
    this.app.logger.info(this.path)

    this.initialize()
  }

  async initialize() {
    if (!isAbsolute(this.path)) {
      throw new Error('Path to sensor must be absolute')
    }

    this.name = await this.getName()

    super.initialize()
  }

  async getName() {
    const name = await readFile(join(this.path, 'name'))
    return name.toString().trim()
  }

  async getRawTemperature() {
    return readFile(join(this.path, 'temperature'))
  }

  async read() {
    const rawTemp = await this.getRawTemperature()
    const degreesC = parseInt(rawTemp, 10) / 1000
    const result = this.formatNumber(this.options.scale === 'F' ? this.degreesFahrenheit(degreesC) : degreesC)

    this.lastReading = result
    return result
  }

  degreesFahrenheit(temp) {
    return temp * (9 / 5) + 32
  }

  formatNumber(num, precision = 2) {
    return parseFloat(num.toFixed(2))
  }
}

module.exports = DS18B20
