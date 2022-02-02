const parseDuration = require('parse-duration')

class Rule {
  static comparisons = {
    eq: (a, b) => a === ba,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
  }

  constructor({ threshold, comparison, interval, action, sensor }) {
    this.sensor = sensor
    this.threshold = threshold
    this.comparison = comparison
    this.interval = parseDuration(interval)
    this.action = action
  }

  matches(reading) {
    return this.constructor.comparisons[this.comparison](reading, this.threshold)
  }
}

module.exports = Rule
