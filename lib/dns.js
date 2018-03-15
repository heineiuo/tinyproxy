const named = require('node-named')
const server = named.createServer()

server.on('query', function (query) {
  const domain = query.name()
  const response = process.env.IPV4
  console.log('DNS Query: %s, response: %s', domain, response)

  const ttl = 300
  const target = new named.ARecord(response)
  query.addAnswer(domain, target, ttl)
  server.send(query)
})

module.exports = module.exports.default = server
