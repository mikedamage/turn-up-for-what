const { join } = require('path')
const { readdirSync } = require('fs/promises')
const { Gpio } = require('onoff')
const Sensor = require('./sensor')

export default class App {
  static defaults = {
    sensorDir: '/sys/bus/w1/devices',
  }

  constructor(options = {}) {
    this.config = { ...this.constructor.defaults, ...options }
    this.sensors = []

    this.getSensors()
  }

  getSensors(reload = false) {
    if (this.sensors && !reload) return this.sensors

    const dir = readdirSync(this.config.sensorDir)
    this.sensors = dir.reduce((out, child) => {
      if (!child.startsWith('28-')) return out
      out.push(new Sensor(join(this.config.sensorDir, child)))
      return out
    }, [])

    return this.sensors
  }

  async resetRelays() {

  }

}