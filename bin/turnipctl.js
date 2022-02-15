#!/usr/bin/env node

import path from 'node:path'
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
      type: 'string'
    }
  })
  .help('h')
  .version()
  .demandCommand(1, 'Please enter a command')

console.log(argv)
const [, command, ...args] = argv._
const client = net.createConnection(argv.socket, () => {
  console.log('connected')
  client.write(command + '\r\n')
})

client.on('data', (data) => {
  console.log(data.toString())
})
