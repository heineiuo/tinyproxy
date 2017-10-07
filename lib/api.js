const express = require('express')
const { updateCert } = require('./sni')

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

api.get('/user/token/get', (req, res, next) => {
  next()
})

module.exports = module.exports.default = api
