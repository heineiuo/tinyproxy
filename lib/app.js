const fs = require('fs')
const http = require('http')
const https = require('https')
const express = require('express')
const morgan = require('morgan')
const path = require('path')
const mkdirp = require('mkdirp')
const dotenv = require('dotenv')
const httpProxy = require('http-proxy')
const defaults = require('lodash/defaults')
const { homedir } = require("os")
const { URL } = require("url")
const vhost = require('vhost')
const compression = require('compression')
const { SNIMiddleware } = require('./sni')
const apiApp = require('./api')

const GATEWAY_CONFIG = JSON.parse(fs.readFileSync(
  path.resolve(process.env.DATA_DIR, process.env.CONFIG_FILE)
))

const app = express()

// if (process.env.NODE_ENV !== 'production')
app.use(morgan('dev'))
app.use(compression())
app.use(SNIMiddleware())

app.use((req, res, next) => {

  const fullUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`
  const { hostname, pathname } = new URL(fullUrl)

  if (!GATEWAY_CONFIG.domains.hasOwnProperty(hostname)) return next()
  const config = GATEWAY_CONFIG.domains[hostname]
  if (config.levelHTTPS === 'HTTPS_FORCE' && req.protocol === 'http') {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
  }
  const proxy = httpProxy.createProxyServer({
    // protocolRewrite: 'http'
  })

  proxy.web(req, res, {
    target: config.http
  })

  proxy.on('error', (err, req, res) => {
    next(err)
  })

  proxy.on('proxyRes', (proxyRes, req, res) => {
    Object.keys(proxyRes.headers).forEach(key => {
      res.set(key, proxyRes.headers[key])
    })
  })
})

app.use(vhost('127.0.0.1', apiApp))


app.use((err, req, res, next) => {
  res.json({
    error: err.name,
    message: err.message
  })
})

app.use((req, res) => {
  res.status(404)
  res.json({
    error: 'NotFoundError',
    message: 'Not Found'
  })
})

module.exports = module.exports.default = app
