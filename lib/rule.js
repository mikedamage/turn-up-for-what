class Rule {
  static comparisons = {
    eq: (a, b) => a === ba,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
  }

  constructor({ temperature, comparison, action, sensor }) {
    this.sensor = sensor
    this.temperature = temperature
    this.comparison = comparison
    this.action = action
  }

  matches(temp) {
    return this.constructor.comparisons[this.comparison](temp, this.temperature)
  }
}

module.exports = Rule
