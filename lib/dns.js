const dns = require('native-dns')
const server = dns.createServer()

server.on('request', function (request, response) {
  response.answer.push(dns.A({
    name: request.question[0].name,
    address: process.env.IPV4,
    ttl: 600,
  }))

  // response.answer.push(dns.A({
  //   name: request.question[0].name,
  //   address: process.env.IPV4,
  //   ttl: 600,
  // }))


  // response.additional.push(dns.A({
  //   name: 'example.org',
  //   address: process.env.IPV4,
  //   ttl: 600,
  // }))
  response.send()
})

server.on('error', function (err, buff, req, res) {
  console.log(err.stack)
})

module.exports = server
