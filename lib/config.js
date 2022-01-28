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
    default: null,
    nullable: true,
  },
  triggerState: {
    doc: 'The state to set the relay to when the rule is triggered',
    type: String,
    default: 'on',
  },
}

const sensorSchema = {
  name: {
    doc: 'Friendly name to identify this sensor',
    format: String,
    default: null,
  },
  driver: {
    doc: 'Name of a NPM package or path to JS module that handles reading the sensor',
    format: String,
    default: null,
  },
  options: {
    doc: 'Options to configure the sensor driver',
    format: Object,
    default: {},
    nullable: true,
  },
}

const outputSchema = {
  name: {
    doc: 'Friendly name to identify this output',
    format: String,
    default: null,
  },
  driver: {
    doc: 'Name of an NPM package or path to a JS module that defines how to interact with this output',
    format: String,
    default: null,
  },
  options: {
    doc: 'Options object to configure the output driver',
    format: Object,
    default: {},
    nullable: true,
  },
}

const schemaArrayValidator = (schema) => (rules) => {
  if (!Array.isArray(rules)) throw new Error('Must be an array')

  for (rule of rules) {
    convict(schema).load(rule).validate()
  }
}

convict.addFormat({
  name: 'rule-array',
  validate: schemaArrayValidator(ruleSchema),
})

convict.addFormat({
  name: 'sensor-array',
  validate: schemaArrayValidator(sensorSchema),
})

convict.addFormat({
  name: 'output-array',
  validate: schemaArrayValidator(outputSchema),
})

const config = convict({
  sensorDir: {
    doc: 'Absolute path to directory containing 1-wire sensor interfaces',
    default: '/sys/bus/w1/devices',
    format: String,
    env: 'SENSOR_DIR',
  },
  sensors: {
    doc: 'An array of sensor configuration objects',
    format: 'sensor-array',
    default: [],
  },
  outputs: {
    doc: 'An array of output configuration objects',
    format: 'output-array',
    default: [],
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
