export const unique = (arr) => [...new Set(arr)]
export const compact = (arr) => arr.filter(Boolean)
export const pick = (arrOfObjects, prop) => arrOfObjects.map((obj) => obj[prop])
export const formatNumber = (num, precision = 2) => parseFloat(num.toFixed(precision))
export const celsiusToFahrenheit = (temp) => temp * (9 / 5) + 32
export const isRelativeNumber = (num) => num.startsWith('+') || num.startsWith('-')