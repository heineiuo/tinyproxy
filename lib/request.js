const express = require('express')
const morgan = require('morgan')
const vhost = require('vhost')
const compression = require('compression')
const { promisify } = require('util')
const api = require('./api')
const targets = require('./targets')
const { SNIMiddleware } = require('./sni')

const app = express()

app.use(morgan('dev'))
app.use(compression())
app.use(SNIMiddleware())
app.use((req, res, next) => {
  const proxy = targets.getTargetProxy(req)
  if (!proxy) return next()

  const config = proxy._config

  if (config.levelHTTPS && config.levelHTTPS === 'HTTPS_FORCE' && req.protocol === 'http') {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
  }

  proxy.web(req, res)

  proxy.on('error', (err, req, res) => {
    next(err)
  })

  proxy.on('proxyRes', (proxyRes, req, res) => {
    Object.keys(proxyRes.headers).forEach(key => {
      res.set(key, proxyRes.headers[key])
    })
  })
})

app.use(vhost('127.0.0.1', api))

module.exports = module.exports.default = app
