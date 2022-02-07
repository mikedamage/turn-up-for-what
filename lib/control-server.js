const net = require('net')
const repl = require('repl')
const { threadId } = require('worker_threads')

const createREPL = (socket, app) => {
  const session = repl.start('tufw> ', socket)
  session.context.app = app

  session.defineCommand('logout', {
    help: 'Disconnect from console',
    action: () => {
      app.logger.info('session disconnected')
      socket.write('goodbye\n')
      session.close()
    }
  })

  session.defineCommand('pause', {
    help: 'Stop monitoring sensors and executing rules',
    async action() {
      this.clearBufferedCommand()
      await app.pause()
      socket.write('monitoring paused\n')
      this.displayPrompt()
    }
  })

  session.defineCommand('start', {
    help: 'Start (or restart) monitoring rule execution',
    async action() {
      this.clearBufferedCommand()
      await app.start()
      socket.write('monitoring started\n')
      this.displayPrompt()
    }
  })

  session.defineCommand('stop', {
    help: 'Stops monitoring AND resets outputs to default state',
    async action() {
      this.clearBufferedCommand()
      await app.stop()
      socket.write('monitoring stopped, outputs reset\n')
      this.displayPrompt()
    }
  })

  session.defineCommand('outputs', {
    help: 'List available outputs by name and current state',
    action() {
      this.clearBufferedCommand()
      for (let key of Object.keys(app.outputs)) {
        socket.write(`${key}: ${app.outputs[key].state}\n`)
      }
      this.displayPrompt()
    }
  })

  session.defineCommand('sensors', {
    help: 'List available sensors by name and most recent reading value',
    action() {
      this.clearBufferedCommand()
      for (let key of Object.keys(app.sensors)) {
        socket.write(`${key}: ${app.sensors[key].lastReading}\n`)
      }
      this.displayPrompt()
    }
  })

  session.defineCommand('readSensor', {
    help: 'Read named sensor (ex. .readSensor thermometer1)',
    async action(name) {
      this.clearBufferedCommand()
      const reading = await app.readSensor(name)
      socket.write(reading + '\n')
      this.displayPrompt()
    }
  })

  session.defineCommand('setOutput', {
    help: 'Set output value (ex. .setOutput output-name:on)',
    async action(args) {
      this.clearBufferedCommand()
      const [output, value] = args.split(':')
      await app.setOutput(output, value)
      socket.write(`Output ${output} set to ${value}\n`)
      this.displayPrompt()
    }
  })
}

module.exports = function createControlServer(app, socket) {
  const server = net
    .createServer((stream) => {
      let session
      app.logger.info('Control connection established')

      stream.on('data', (data) => {
        const cmd = data.toString().trim()
        app.logger.info('control server command received: %s', cmd)

        if (cmd === 'console') {
          app.logger.info('start console')
          session = createREPL(stream, app)
        }
      })
    })
    .listen(socket)

  return server
}
