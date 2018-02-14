const httpProxy = require('http-proxy')

module.exports = (config) => (req, res, next) => {

  const proxy = httpProxy.createProxyServer({
    // protocolRewrite: 'http'
  })

  proxy.web(req, res, {
    target: config.http
  })

  proxy.on('error', (err, req, res) => {
    next(err)
  })

  proxy.on('proxyRes', (proxyRes, req, res) => {
    Object.keys(proxyRes.headers).forEach(key => {
      res.set(key, proxyRes.headers[key])
    })
  })
}
