const fs = require('fs')
const path = require('path')
const Url = require('url')
const { SeashellGateway } = require('seashell')

let gateway

const GATEWAY_CONFIG = JSON.parse(fs.readFileSync(
  path.resolve(process.env.DATA_DIR, process.env.CONFIG_FILE)
))

module.exports.init = (server) => {
  gateway = new SeashellGateway()
  gateway.createGatewayServer((req, res) => {

  }, async (socket, req) => {

    const url = Url.parse(req.url, { parseQueryString: true })
    if (!url.query.id) throw new Error('forbidden 1')
    if (!url.query.secret) throw new Error('forbidden 2')

    const target = Object.entries(GATEWAY_CONFIG.domains).find(([key, value]) => {
      return value.lanproxy === url.query.id
    })
    if (!target) throw new Error('forbidden 3')
    console.log(`[lanproxy] ${target[0]} connected`)
    return {
      id: target[1].lanproxy
    }

  }, {
      server
    })
}

module.exports.middleware = (config) => (req, res, next) => {
  const { lanproxy } = config
  if (!gateway) throw new Error('Proxy unready')

  if (!gateway.clientMap[lanproxy]) {
    throw new Error('Service Unavilable')
  }

  const reqToLan = gateway.request(`${lanproxy}${req.url}`, {
    headers: Object.assign({}, req.headers, {
      method: req.method
    })
  }, (resFromLan) => {
    if (!res.headersSent) {
      res.status(resFromLan.statusCode)
      Object.keys(resFromLan.headers).forEach((key) => {
        res.setHeader(key, resFromLan.headers[key])
      })
    }

    resFromLan.on('data', (data) => {
      // console.log(data)
      res.write(data)
    })

    resFromLan.on('end', () => {
      res.end()
    })
  })

  const noBodyMethods = [
    'GET', 'COPY', 'HEAD', 'PURGE', 'UNLOCK'
  ]

  if (noBodyMethods.includes(req.method)) {
    reqToLan.end()
  } else {
    req.on('data', (data) => {
      reqToLan.write(data)
    })
    req.on('end', () => {
      reqToLan.end()
    })
  }
}

