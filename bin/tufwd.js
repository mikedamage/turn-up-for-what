const net = require('net')
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
process.on('beforeExit', async () => {
  logger.info('Stopping main loop and exiting')
  await app.stop()
  process.exit()
})
*/
