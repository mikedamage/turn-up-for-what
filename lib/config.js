const path = require('path')
const convict = require('convict')

const config = convict({
  sensorDir: {
    doc: 'Absolute path to directory containing 1-wire sensor interfaces',
    default: '/sys/bus/w1/devices',
    format: String,
    env: 'SENSOR_DIR',
  },
  relays: {
    doc: 'GPIO pin numbers corresponding to controllable relays',
    default: [],
    format: Array,
    env: 'RELAYS',
  },
  interval: {
    doc: 'How frequently to measure temperature and perform actions, in seconds',
    format: Number,
    default: 60,
    env: 'INTERVAL',
  },
  scale: {
    doc: 'Which scale to measure temperature in (C or F)',
    format: ['C', 'F'],
    default: 'F',
    env: 'SCALE',
  },
})

config.loadFile(path.join(__dirname, '../config.json'))
config.validate({ allowed: 'strict' })

module.exports = config
