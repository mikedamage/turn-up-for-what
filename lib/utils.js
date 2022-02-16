import path from 'node:path'
import { tmpdir } from 'node:os'

export const unique = (arr) => [...new Set(arr)]
export const compact = (arr) => arr.filter(Boolean)
export const pick = (arrOfObjects, prop) => arrOfObjects.map((obj) => obj[prop])
export const formatNumber = (num, precision = 2) => parseFloat(num.toFixed(precision))
export const celsiusToFahrenheit = (temp) => temp * (9 / 5) + 32
export const isRelativeNumber = (num) => {
  const numStr = '' + num
  return numStr.startsWith('+') || numStr.startsWith('-')
}

export const CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config')
export const DEFAULT_SOCKET_PATH = path.join(tmpdir(), 'turnip.sock')
