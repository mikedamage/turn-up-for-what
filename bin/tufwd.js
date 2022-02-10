#!/usr/bin/env node

const path = require('path')
const CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(process.env.HOME, '.config')
const fs = require('fs')
const { argv } = require('yargs')
  .options({
    config: {
      alias: 'c',
      describe: 'Path to JSON config file',
      default: path.join(CONFIG_HOME, 'tufw/config.json'),
      type: 'string',
    },
  })
  .help('h')
  .version()
const config = require('../lib/config')(argv.config)
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
const app = new AppController({ config, logger })
const server = createControlServer(app, socket)

const stopServer = () =>
  new Promise((resolve) => {
    server.close(() => {
      app.logger.info('Control server stopped, delete socket %s', socket)
      if (fs.existsSync(socket)) fs.unlinkSync(socket)
      resolve()
    })
  })[('SIGTERM', 'SIGINT', 'SIGQUIT', 'error')].forEach((signal) => {
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
