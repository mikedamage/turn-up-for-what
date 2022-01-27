const AppController = require('../lib/app')
const app = new AppController({ relays: [25, 26] })

app.start()

process.on('SIGINT', () => {
  console.log('Stopping main loop and exiting')
  app.stop()
})
