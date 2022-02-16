#!/usr/bin/env node

import net from 'node:net'
import yargs from 'yargs'
import { DEFAULT_SOCKET_PATH } from '../lib/utils.js'

const { argv } = yargs(process.argv)
  .usage('turnipctl [-s PATH_TO_SOCKET] COMMAND [...ARGS]')
  .options({
    socket: {
      alias: 's',
      describe: 'Path to Turnip control socket',
      default: DEFAULT_SOCKET_PATH,
      type: 'string',
    },
  })
  .help('h')
  .version()
  .demandCommand(1, 'Please enter a command')

const [command, ...args] = argv._.slice(2)
const client = net.createConnection(argv.socket, () => {
  if (command !== 'console') {
    client.write([command, ...args].join(' ') + '\r\n', 'utf8', () => {
      client.end()
    })
  }
})

client.on('data', (data) => {
  console.log(data.toString())
})
