const path = require('path')
const convict = require('convict')

const ruleSchema = {
  sensor: {
    doc: 'The name of a configured sensor that this rule will apply to. Rule applies to all sensor readings if omitted.',
    format: String,
    default: null,
    nullable: true,
  },
  temperature: {
    doc: 'The temperature with which ambient temp will be compared',
    format: Number,
    default: 0,
  },
  comparison: {
    doc: 'How to compare ambient temp with reference temp (eq, lt, gt, lte, gte)',
    format: (val) => ['eq', 'lt', 'gt', 'lte', 'gte'].includes(val),
    default: 'eq',
  },
  action: {
    doc: 'An object describing an output and the state it should be in when the rule matches',
    format: Object,
    default: {},
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
