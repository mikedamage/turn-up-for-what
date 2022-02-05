const fs = require('fs')
const argv = require('yargs').argv
const path = require('path')
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

const socket = path.resolve(__dirname, '../tmp/tufw.sock')
const createControlServer = require('../lib/control-server')
const AppController = require('../lib/app')
const app = new AppController({ ...config, logger })
const server = createControlServer(app, socket)

// const cli = repl.start('thermostat> ')
// cli.context.app = app

process.on('beforeExit', () => {
  server.close(() => {
    app.logger.info('Control server stopped, delete socket %s', socket)
    fs.unlinkSync(socket)
  })
})

process.on('exit', () => {
  app.clearTimers()
})
