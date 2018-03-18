process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser

require('./autoenv')

const http = require('http')
const https = require('https')
const { SNICallback } = require('./sni')
const handleUpgrade = require('./handle-upgrade')
const handleRequest = require('./handle-request')
const dnsServer = require('./dns')

const httpServer = http.createServer(handleRequest)
const httpsServer = https.createServer({ SNICallback }, handleRequest)
httpServer.on('upgrade', handleUpgrade)
httpsServer.on('upgrade', handleUpgrade)

if (__DEV__) {
  httpServer.listen(8080, console.log('http:8080 dev mode'))
} else {
  dnsServer.serve(53, () => console.log('dns:53'))
  httpServer.listen(80, () => console.log('http:80'))
  httpsServer.listen(443, () => console.log('https:443'))
}
