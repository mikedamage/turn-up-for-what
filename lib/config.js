import convict from 'convict'
import json5 from 'json5'
import { DEFAULT_SOCKET_PATH } from './utils.js'

convict.addParser({ extension: 'json5', parse: json5.parse })

const ruleSchema = {
  sensor: {
    doc: 'The name of a configured sensor that this rule will apply to. Rule applies to all sensor readings if omitted.',
    format: String,
    default: null,
    nullable: true,
  },
  threshold: {
    doc: 'The value with which ambient temp will be compared',
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
  interval: {
    doc: 'How frequently to check this rule (supports ms, s, m, h, d as suffixes)',
    format: String,
    default: '60s',
  },
  immediate: {
    doc: 'Whether or not to check the rule as soon as monitoring begins',
    format: Boolean,
    default: true,
  },
  resetWhenNegative: {
    doc: 'Reset output to default value if rule does not match',
    format: Boolean,
    default: false,
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

export const config = convict({
  socket: {
    doc: 'Path to Unix socket used for controlling the daemon',
    default: DEFAULT_SOCKET_PATH,
    format: String,
    env: 'SOCKET',
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
  rules: {
    doc: 'A collection of temperature range rules',
    format: 'rule-array',
    default: [],
  },
})

export default function loadConfig(configFile) {
  config.loadFile(configFile)
  return config.validate({ allowed: 'strict' })
}
