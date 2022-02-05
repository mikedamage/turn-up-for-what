const net = require('net')
const repl = require('repl')

module.exports = function createControlServer(app, socket) {
  const server = net
    .createServer((stream) => {
      app.logger.info('Control connection established')
      const session = repl.start('tufw> ', stream)
      session.context.app = app
    })
    .listen(socket)

  return server
}
