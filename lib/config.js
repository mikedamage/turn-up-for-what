const path = require('path')
const convict = require('convict')

const ruleSchema = {
  minTemp: {
    doc: 'Minimum temperature to trigger the rule',
    format: Number,
    nullable: true,
    default: null,
  },
  maxTemp: {
    doc: 'Maximum temperature to trigger the rule',
    format: Number,
    nullable: true,
    default: null,
  },
  relay: {
    doc: 'The relay to toggle, identified by GPIO number',
    format: Number,
  },
  triggerState: {
    doc: 'The state to set the relay to when the rule is triggered',
    type: String,
    default: 'on',
  }
}

convict.addFormat({
  name: 'rule-array',
  validate: (rules) => {
    if (!Array.isArray(rules)) {
      throw new Error('Must be an array')
    }

    for (rule of rules) {
      convict(ruleSchema).load(rule).validate()
    }
  }
})

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
  rules: {
    doc: 'A collection of temperature range rules',
    format: 'rule-array',
    default: [],
  },
})

config.loadFile(path.join(__dirname, '../config.json'))
config.validate({ allowed: 'strict' })

module.exports = config
