const http = require('http')
const https = require('https')
require('./autoenv')
require('./dns')
const app = require('./app')
const { SNICallback } = require('./sni')

const httpServer = http.createServer(app)
const httpsServer = https.createServer({ SNICallback }, app)

const cc = (c) => console.log(`Gateway Tiny running on port ${c}`)

if (process.env.NODE_ENV === 'production') {
  httpServer.listen(80, cc('80(http)'))
  httpsServer.listen(443, cc('443(https)'))
} else {
  httpServer.listen(8080, cc('8080(http, dev-mode)'))
}
