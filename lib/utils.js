const unique = (arr) => [...new Set(arr)]
const compact = (arr) => arr.filter(Boolean)
const pick = (arrOfObjects, prop) => arrOfObjects.map((obj) => obj[prop])

module.exports = {
  unique,
  compact,
  pick,
}
