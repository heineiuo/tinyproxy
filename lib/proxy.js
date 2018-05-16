const fs = require('fs')
const path = require('path')
const httpProxy = require('http-proxy')
const parseDomain = require('parse-domain')
const Url = require('url')
const EventEmitter = require('events')
const { SeashellGateway } = require('seashell')
const domains = require('./domains')

const noop = new Function()
let proxyMap = {}
const gateway = new SeashellGateway()

const lanServer = gateway.createGatewayServer((req, res) => { }, async (socket, req) => {
  const url = Url.parse(req.url, { parseQueryString: true })
  if (!url.query.id) throw new Error('forbidden 1')
  if (!url.query.secret) throw new Error('forbidden 2')

  const target = Object.entries(domains.get()).find(([key, value]) => {
    return value.lanproxy === url.query.id
  })
  if (!target) throw new Error('forbidden 3')
  console.log(`[lanproxy] ${target[0]} connected`)
  return {
    id: target[1].lanproxy
  }
}, { noServer: true })


/**
 * @name createLanProxyServer
 * @param {
 *   {string} target
 * } config 
 */
const createLanProxyServer = (config) => {
  const target = config.target
  const proxy = {
    on: noop
  }

  proxy.ws = (req, socket, head) => {
    lanServer.handleUpgrade(req, socket, head, (client) => {
      lanServer.emit('connection', client, req)
    })
  }

  proxy.web = (req, res, { }, next) => {
    if (!gateway.clientMap[target]) {
      next(new Error('Service Unavilable'))
      return
    }

    const reqToLan = gateway.request(`${target}${req.url}`, {
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

  return proxy
}


const getTargetProxy = (req, protocol = ['http']) => {
  const targetHostname = domains.getDomainFromRequest(req, protocol)
  const result = {}
  if (!!targetHostname) {
    protocol.forEach(item => {
      result[item] = proxyMap[item][targetHostname]
    })
  }

  return result
}

const getDomains = () => {
  return domains.get()
}

const RequestMiddleware = () => (req, res, next) => {
  const _proxies = getTargetProxy(req, ['http', 'lan'])
  const proxy = _proxies.http || _proxies.lan
  if (!proxy) return next()

  const config = proxy._config
  if (config.levelHTTPS && config.levelHTTPS === 'HTTPS_FORCE' && req.protocol === 'http') {
    return res.redirect(`https://${req.headers.host}${req.originalUrl}`)
  }

  proxy.web(req, res, {}, next)

  proxy.on('proxyRes', (proxyRes, req, res) => {
    Object.keys(proxyRes.headers).forEach(key => {
      res.set(key, proxyRes.headers[key])
    })
  })
}

const init = (domainsConfig) => {
  proxyMap = {
    ws: {},
    http: {},
    lan: {}
  }


  Object.entries(domainsConfig).forEach(([hostname, config]) => {
    if (config.hasOwnProperty('http')) {
      proxyMap['http'][hostname] = httpProxy.createProxyServer({
        target: config.http,
        secure: config.https_secure
      })
      proxyMap['http'][hostname]._config = config
    }
    if (config.hasOwnProperty('ws')) {
      proxyMap['ws'][hostname] = httpProxy.createProxyServer({
        target: config.ws,
        ws: true
      })
      proxyMap['ws'][hostname]._config = config
    }
    if (config.hasOwnProperty('lanproxy') && config.hasOwnProperty('lanproxy_secret')) {
      proxyMap['lan'][hostname] = createLanProxyServer({
        target: config.lanproxy
      })
      proxyMap['lan'][hostname]._config = config
    }
  })
}


init(domains.get())

domains.on('change', init)

module.exports = module.exports.default = {
  getTargetProxy,
  RequestMiddleware,
}
