// lan server
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')

const app = express()

app.use(morgan('dev'))
app.use(compression())
app.use(express.json())
app.get('/', (req, res) => {
  res.end('hello world')
})

app.get('/image', (req, res) => {
  res.sendFile(__dirname + '/image.png')
})

app.post('/object-keys', (req, res) => {
  res.json(Object.keys(req.body))
})

app.listen(10835, () => {
  console.log('listening on port 10835')
})

/************************************************/

// client, can run standalone
const { SeashellClient } = require('seashell')
const http = require('http')

const client = new SeashellClient()

// target service address : 'http://localhost:10835'
client.createServer((req, res) => {
  const targetReq = http.request({
    protocol: 'http:',
    hostname: 'localhost',
    port: 10835,
    path: req.headers.url,
    method: req.headers.httpMethod || 'GET',
    headers: req.headers.httpHeaders || {},
  }, (targetRes) => {
    targetRes.on('data', (chunk) => {
      res.write(chunk)
    })
    targetRes.on('end', () => {
      res.end()
    })
  })

  req.on('data', (data) => {
    targetReq.write(data)
  })

  req.on('end', () => {
    targetReq.end()
  })

}, {
    serverAddress: 'ws://localhost:8080?id=lanproxy.localhost&secret=bbb3919786197a50622d14f2424fc12f540710dae88105a59c61613e189a'
  })

console.log('client started')
