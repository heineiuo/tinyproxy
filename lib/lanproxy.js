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
  const { lanproxy, lanproxy_secret } = config
  if (!gateway) throw new Error('NOT READY')

  if (!gateway.clientMap[lanproxy]) {
    throw new Error('Service Unavilable')
  }

  // console.log(req.headers)
  // console.log(req.rawHeaders)

  const req2 = gateway.request(`${lanproxy}${req.url}`, {
    headers: {
      httpHeaders: req.headers,
      httpMethod: req.method
    }
  })

  const noBodyMethos = [
    'GET', 'COPY', 'HEAD', 'PURGE', 'UNLOCK'
  ]

  if (noBodyMethos.includes(req.method)) {
    // console.log('no body methods ignore body')
    req2.end()
  } else {
    req.on('data', (data) => {
      req2.write(data)
    })
    req.on('end', () => {
      req2.end()
    })
  }

  req2.res.on('data', (data) => {
    // console.log(data)
    res.write(data)
  })
  req2.res.on('end', () => {
    // console.log('end')
    res.end()
  })
}

