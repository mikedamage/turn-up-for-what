const os = require('os')
const path = require('path')
const fs = require('fs')
/*
const argv = require('yargs').options({
  s: {
    alias: 'socket',
    describe: 'Unix domain socket to listen for commands',
    default: path.resolve(os.tmpdir(), 'tufw', 'tufw.sock'),
    type: 'string',
  }
}).argv
*/
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

const socket = config.get('socket')
const createControlServer = require('../lib/control-server')
const AppController = require('../lib/app')
const app = new AppController({ ...config, logger })
const server = createControlServer(app, socket)

const stopServer = () => new Promise((resolve) => {
  server.close(() => {
    app.logger.info('Control server stopped, delete socket %s', socket)
    if (fs.existsSync(socket)) fs.unlinkSync(socket)
    resolve()
  })
})

['SIGTERM', 'SIGINT', 'SIGQUIT', 'error'].forEach((signal) => {
  process.on(signal, () => {
    stopServer()
    process.exit()
  })
})

process.on('beforeExit', stopServer)

process.on('exit', () => {
  app.pause()
})

app.start()