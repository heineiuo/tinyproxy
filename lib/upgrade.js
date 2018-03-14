const targets = require('./targets')

const upgradeHandler = function (req, socket, head) {
  const proxy = targets.getTargetProxy(req, 'ws')
  if (!proxy) {
    console.log('Cannot found target')
    req.end()
    socket.end()
    return
  }
  proxy.ws(req, socket, head)
}

module.exports = upgradeHandler
