const fs = require('fs')
const path = require('path')
const httpProxy = require('http-proxy')
const parseDomain = require('parse-domain')

let ws_proxies = {}
let http_proxies = {}
let domains = {}

const init = (optionDomain) => {
  ws_proxies = {}
  http_proxies = {}

  if (!!optionDomain) {
    domains = optionDomain
  } else {
    const GATEWAY_CONFIG = JSON.parse(fs.readFileSync(
      path.resolve(process.env.DATA_DIR, process.env.CONFIG_FILE)
    ))
    domains = GATEWAY_CONFIG.domains
  }

  Object.entries(domains).forEach(([hostname, config]) => {
    if (config.hasOwnProperty('http')) {
      http_proxies[hostname] = httpProxy.createProxyServer({
        target: config.http,
      })
      http_proxies[hostname]._config = config
    }
    if (config.hasOwnProperty('ws')) {
      ws_proxies[hostname] = httpProxy.createProxyServer({
        target: config.ws,
        ws: true
      })
      ws_proxies[hostname]._config = config
    }
  })
}

const getWildcardDomain = (hostname) => {
  const parsed = parseDomain(hostname)
  if (!parsed) return `*.${hostname}`
  const { subdomain, domain: rootdomain, tld } = parsed
  const subdomainSplited = subdomain.split('.')
  const sld = subdomainSplited[subdomainSplited.length - 1]
  return [sld === '' ? '*' : `*.${sld}`, rootdomain, tld].join('.')
}

const getTargetProxy = (req, protocol) => {
  // const fullUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`
  // const { hostname, pathname } = new URL(fullUrl)

  const hostname = req.headers.host.split(':')[0]
  let targetHostname = null
  let wildcardDomain = null

  if (domains.hasOwnProperty(hostname)) {
    targetHostname = hostname
  } else {
    wildcardDomain = getWildcardDomain(hostname)
    if (domains.hasOwnProperty(wildcardDomain)) {
      targetHostname = wildcardDomain
    }
  }
  if (!targetHostname) return null
  const proxies = protocol === 'ws' ? ws_proxies : http_proxies
  return proxies[targetHostname] || null
}

init()

module.exports = module.exports.default = {
  ws: ws_proxies,
  http: http_proxies,
  getTargetProxy,
}
