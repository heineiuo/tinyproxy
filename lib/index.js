process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

require('./autoenv')

const http = require('http')
const https = require('https')
const { SNICallback } = require('./sni')
const upgradeHandler = require('./upgrade')
const requestHandler = require('./request')
const dnsServer = require('./dns')

const httpServer = http.createServer(requestHandler)
const httpsServer = https.createServer({ SNICallback }, requestHandler)
httpServer.on('upgrade', upgradeHandler)
httpsServer.on('upgrade', upgradeHandler)

if (__DEV__) {
  httpServer.listen(8080, console.log('http:8080 dev mode'))
  httpsServer.on('upgrade', upgradeHandler)
} else {
  dnsServer.listen(53, '::ffff:0.0.0.0', () => console.log('dns:53'))
  httpServer.listen(80, () => console.log('http:80'))
  httpsServer.listen(443, () => console.log('https:443'))
}
