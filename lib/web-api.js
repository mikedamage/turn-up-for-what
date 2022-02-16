import express from 'express'
import { Gauge, Histogram, Registry } from 'prom-client'

export default function createWebApiServer(app) {
  const port = app.config.get('webPort')
  const api = express()

  api.get('/', (_req, res) => {
    res.send('OK')
  })

  api.get('/outputs', (_req, res) => {
    res.json(app.outputs)
  })

  api.get('/sensors', (_req, res) => {
    res.json(app.sensors)
  })

  api.listen(port, () => {
    app.logger.info(`Web API server listening at http://localhost:${port}`)
  })

  return api
}