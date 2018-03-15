const _proxy = require('./proxy')

const upgradeHandler = function (req, socket, head) {
  const proxies = _proxy.getTargetProxy(req, ['lan', 'ws'])
  const proxy = proxies.lan || proxies.ws
  if (!proxy) {
    console.log('Cannot found target proxy')
    req.end()
    socket.end()
    return
  }
  proxy.ws(req, socket, head)
}

module.exports = module.exports.default = upgradeHandler
