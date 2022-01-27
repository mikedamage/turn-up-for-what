const config = require('../lib/config')
const pino = require('pino')
const transport = pino.transport({
  target: 'pino/pretty',
})
const logger = pino(transport)

logger.info(config)

const AppController = require('../lib/app')
const app = new AppController(config)

app.start()

process.on('SIGINT', () => {
  console.log('Stopping main loop and exiting')
  app.stop()
})
