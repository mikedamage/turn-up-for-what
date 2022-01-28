const argv = require('yargs').argv
const repl = require('repl')
const config = require('../lib/config')
const pino = require('pino')
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: Boolean(process.stdout.isTTY),
    },
  },
})

const AppController = require('../lib/app')
const app = new AppController({ ...config, logger })

logger.info({ argv })

const cli = repl.start('thermostat> ')
cli.context.app = app

/*

logger.info('Starting watcher process')
app.start()

process.on('SIGINT', async () => {
  console.log('Stopping main loop and exiting')
  await app.stop()
  process.exit()
})
*/
