const express = require('express')
const { updateCert } = require('./sni')
const domains = require('./domains')

const api = express()

api.get('/reload', (req, res, next) => {
  const errors = []
  res.json({
    errors
  })
})

api.get('/cert/renew', (req, res, next) => {
  const errors = []
  const { hostname } = req.query
  updateCert(hostname, (err) => {
    if (err) return next(err)
    res.json(errors)
  })
})

api.get('/domain', (req, res, next) => {
  res.json(domains.get())
})

api.use((err, req, res, next) => {
  res.json({
    error: err.name,
    message: err.message
  })
})

api.use((req, res) => {
  res.status(404)
  res.json({
    error: 'NotFoundError',
    message: 'Not Found'
  })
})

module.exports = module.exports.default = api
