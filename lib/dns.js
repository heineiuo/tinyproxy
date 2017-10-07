const named = require('node-named')
const server = named.createServer()
const ttl = 300

server.listen('53', '::ffff:0.0.0.0', function () {
  console.log('DNS server started on port 53')
})

server.on('query', function (query) {
  const domain = query.name()
  console.log('DNS Query: %s, response: %s', domain, process.env.IPV4)

  const target = new named.ARecord(response)
  query.addAnswer(domain, target, ttl)
  server.send(query)
})
