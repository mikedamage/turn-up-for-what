const { readFile } = require('fs/promises')
const { join, isAbsolute } = require('path')
const BaseSensor = require('./base')
const { formatNumber, celsiusToFahrenheit } = require('../lib/utils')

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
    const result = formatNumber(this.options.scale === 'F' ? celsiusToFahrenheit(degreesC) : degreesC)

    this.lastReading = result
    return result
  }
}

module.exports = DS18B20
