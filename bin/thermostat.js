const App = require('../lib/app')

const relay1 = new Gpio(25, 'out')
const relay2 = new Gpio(26, 'out')

const sensorDir = '/sys/bus/w1/devices'

async function resetRelays() {
  await Promise.all([relay1.write(1), relay2.write(1)])
}

async function getSensors() {
  const dir = await readdir(sensorDir)
  const devices = dir.filter((child) => child.startsWith('28-'))

  return devices
}

async function readSensor(sensor) {
  const temp = path.join(sensorDir, sensor, 'temperature')
  const value = await readFile(temp)
  const degreesC = parseInt(value, 10) / 1000
  const degreesF = degreesC * (9 / 5) + 32

  return degreesF
}

async function main() {
  await resetRelays()

  const [sensor] = await getSensors()
  const reading = await readSensor(sensor)

  console.log('Temp reading: %s', reading)
}

main()
