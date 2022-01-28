const repl = require('repl')
const config = require('../lib/config')
const pino = require('pino')
const transport = pino.transport({
  target: 'pino/pretty',
})
const logger = pino(transport)

const AppController = require('../lib/app')
const app = new AppController({ ...config, logger })

logger.info('Starting watcher process')

app.start()

process.on('SIGINT', () => {
  console.log('Stopping main loop and exiting')
  app.stop()
})
