const unique = (arr) => [...new Set(arr)]
const compact = (arr) => arr.filter(Boolean)
const pick = (arrOfObjects, prop) => arrOfObjects.map((obj) => obj[prop])
const formatNumber = (num, precision = 2) => parseFloat(num.toFixed(precision))
const celsiusToFahrenheit = (temp) => temp * (9 / 5) + 32

module.exports = {
  unique,
  compact,
  pick,
  formatNumber,
  celsiusToFahrenheit,
}
