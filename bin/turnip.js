#!/usr/bin/env node

import path from 'node:path'
import fs from 'node:fs'
import yargs from 'yargs'
import loadConfig, { config } from '../lib/config.js'
import createControlServer from '../lib/control-server.js'
import pino from 'pino'
import AppController from '../lib/app.js'
import { CONFIG_HOME } from '../lib/utils.js'

const { argv } = yargs(process.argv)
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

// const config = loadConfig(argv.config)
config.loadFile(argv.config)
const socket = config.get('socket')
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: Boolean(process.stdout.isTTY),
    },
  },
})

const initApp = () => {
  const app = new AppController({ config, logger })
  const server = createControlServer(app, socket)
  app.start()
  return { app, server }
}

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

const { app, server } = initApp()

app.start()
