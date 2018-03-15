const express = require('express')
const morgan = require('morgan')
const vhost = require('vhost')
const compression = require('compression')
const api = require('./api')
const { RequestMiddleware } = require('./proxy')
const { SNIMiddleware } = require('./sni')

const app = express()

app.use(morgan('dev'))
app.use(compression())
app.use(SNIMiddleware())
app.use(RequestMiddleware())
app.use(vhost('127.0.0.1', api))

module.exports = module.exports.default = app
