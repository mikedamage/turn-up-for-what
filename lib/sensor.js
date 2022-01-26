const { readFile } = require('fs/promises')
const { join, isAbsolute } = require('path')

class Sensor {
  static defaults = {
    scale: 'F',
  }

  constructor(path, options = {}) {
    this.config = { ...this.constructor.defaults, ...options }
    this.path = path
    this.ready = false

    this.getName().then(() => {
      this.ready = true
    })

    if (!isAbsolute(this.path)) {
      throw new Error('Path to sensor must be absolute')
    }
  }

  async getName() {
    if (this._name) return this._name
    const name = await readFile(join(this.path, 'name'))
    this._name = name
    return name
  }

 async getRawTemperature() {
    return readFile(join(this.path, 'temperature'))
  }

  async read() {
    const rawTemp = await this.getRawTemperature()
    const degreesC = parseInt(rawTemp, 10) / 1000

    if (this.config.scale === 'C') return degreesC

    return this.degreesFahrenheit(degreesC)
  }

  degreesFahrenheit(temp) {
    return temp * (9 / 5) + 32
  }
}

module.exports = Sensor
