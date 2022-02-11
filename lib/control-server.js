import fs from 'node:fs'
import net from 'node:net'
import repl from 'node:repl'

export const commands = {
  pause: async (socket, app) => {
    await app.pause()
    socket.write('monitoring paused\n')
  },
  start: async (socket, app) => {
    await app.start()
    socket.write('monitoring started\n')
  },
  stop: async (socket, app) => {
    await app.stop()
    socket.write('monitoring stopped, outputs reset\n')
  },
  outputs: (socket, app) => {
    for (let key of Object.keys(app.outputs)) {
      socket.write(`${key}: ${app.outputs[key].state}\n`)
    }
  },
  sensors: (socket, app) => {
    for (let key of Object.keys(app.sensors)) {
      socket.write(`${key}: ${app.sensors[key].lastReading}\n`)
    }
  },
  readSensor: async (socket, app, name) => {
    const reading = await app.readSensor(name)
    socket.write(reading + '\n')
  },
  setOutput: async (socket, app, args) => {
    const [output, value] = args.split(':')
    await app.setOutput(output, value)
    socket.write(`Output ${output} set to ${value}\n`)
  },
}

const createREPL = (socket, app) => {
  const session = repl.start('tufw> ', socket)
  session.context.app = app

  session.defineCommand('logout', {
    help: 'Disconnect from console',
    action: () => {
      app.logger.info('session disconnected')
      socket.write('goodbye\n')
      session.close()
      socket.end()
    },
  })

  session.defineCommand('pause', {
    help: 'Stop monitoring sensors and executing rules',
    async action() {
      this.clearBufferedCommand()
      await commands.pause(socket, app)
      this.displayPrompt()
    },
  })

  session.defineCommand('start', {
    help: 'Start (or restart) monitoring rule execution',
    async action() {
      this.clearBufferedCommand()
      await commands.start(socket, app)
      this.displayPrompt()
    },
  })

  session.defineCommand('stop', {
    help: 'Stops monitoring AND resets outputs to default state',
    async action() {
      this.clearBufferedCommand()
      await commands.stop(socket, app)
      this.displayPrompt()
    },
  })

  session.defineCommand('outputs', {
    help: 'List available outputs by name and current state',
    action() {
      this.clearBufferedCommand()
      commands.outputs(socket, app)
      this.displayPrompt()
    },
  })

  session.defineCommand('sensors', {
    help: 'List available sensors by name and most recent reading value',
    action() {
      this.clearBufferedCommand()
      commands.sensors(socket, app)
      this.displayPrompt()
    },
  })

  session.defineCommand('readSensor', {
    help: 'Read named sensor (ex. .readSensor thermometer1)',
    async action(name) {
      this.clearBufferedCommand()
      await commands.readSensor(socket, app, name)
      this.displayPrompt()
    },
  })

  session.defineCommand('setOutput', {
    help: 'Set output value (ex. .setOutput output-name:on)',
    async action(args) {
      this.clearBufferedCommand()
      await commands.setOutput(socket, app, args)
      this.displayPrompt()
    },
  })
}

export default function createControlServer(app, socket) {
  const server = net.createServer((stream) => {
    let consoleActive = false

    app.logger.info('Control connection established')

    stream.on('data', (data) => {
      const cmd = data.toString().trim()

      if (consoleActive) return

      app.logger.info('control server command received: %s', cmd)

      if (cmd === 'console') {
        app.logger.info('start console')
        const session = createREPL(stream, app)
        consoleActive = true
      } else if (commands[cmd]) {
        commands[cmd](stream, app)
      } else {
        app.logger.warn('invalid command: %s', cmd)
      }
    })
  })

  server.on('error', (e) => {
    // Attempt to connect to socket if it already exists. If connection succeeds, exit because another process is managing it.
    // Otherwise, delete it and re-create for this process.
    if (e.code === 'EADDRINUSE') {
      app.logger.warn('Control socket already in use. Trying to recover.')

      const clientSocket = new net.Socket()

      clientSocket.on('error', (e) => {
        if (e.code === 'ECONNREFUSED') {
          fs.unlinkSync(socket)
          server.listen(socket, () => {
            app.logger.info('Control server recovered and listening.')
          })
        }
      })

      clientSocket.connect({ path: socket }, () => {
        app.logger.error('TUFW Server instance already running. Exiting.')
        process.exit(1)
      })
    }
  })

  server.listen(socket, () => {
    app.logger.info('Control server listening for connections')
  })

  return server
}
