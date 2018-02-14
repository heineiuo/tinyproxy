const http = require('http')
const https = require('https')
const express = require('express')
const morgan = require('morgan')
const mkdirp = require('mkdirp')
const dotenv = require('dotenv')
const defaults = require('lodash/defaults')
const { homedir } = require("os")
const vhost = require('vhost')
const compression = require('compression')
const { URL } = require("url")
const path = require('path')
const fs = require('fs')
const { SNIMiddleware } = require('./sni')
const apiApp = require('./api')
const httpProxyMiddleware = require('./httpproxy')
const lanProxy = require('./lanproxy')

const GATEWAY_CONFIG = JSON.parse(fs.readFileSync(
  path.resolve(process.env.DATA_DIR, process.env.CONFIG_FILE)
))

const app = express()

// if (process.env.NODE_ENV !== 'production')
app.use(morgan('dev'))
app.use(compression())
app.use(SNIMiddleware())

app.use((req, res, next) => {
  // const fullUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`
  // const { hostname, pathname } = new URL(fullUrl)

  const hostname = req.headers.host.split(':')[0]

  if (!GATEWAY_CONFIG.domains.hasOwnProperty(hostname)) {
    return next()
  }

  const config = GATEWAY_CONFIG.domains[hostname]

  let protocols = (config.protocol || 'http').split('+')
  if (!(protocols instanceof Array)) protocols = [protocols]

  if (protocols.includes('lanproxy')) {
    return lanProxy.middleware(config)(req, res, next)
  }

  if (config.levelHTTPS && config.levelHTTPS === 'HTTPS_FORCE' && req.protocol === 'http') {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
  }

  return httpProxyMiddleware(config)(req, res, next)
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
