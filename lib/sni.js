const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const { tmpdir } = require('os')
const { promisify } = require('util')
const ms = require('ms')
const letiny = require('letiny')
const tls = require('tls')

const ctxMap = {}
const renewTimeFile = path.resolve(process.env.DATA_DIR, './.renewTime.json')
const renewTime = JSON.parse(fs.readFileSync(renewTimeFile))
const pemdir = `${process.env.DATA_DIR}/pem`
const GATEWAY_CONFIG = JSON.parse(fs.readFileSync(
  path.resolve(process.env.DATA_DIR, process.env.CONFIG_FILE)
))
let rateLimitPass = 0

/** 
 * 启用ssl的域名
 */
const approvedDomains = Object.keys(GATEWAY_CONFIG.domains).filter(domain => {
  return domain.indexOf('*.') != 0 &&
    GATEWAY_CONFIG.domains[domain].hasOwnProperty('levelHTTPS') && 
    GATEWAY_CONFIG.domains[domain].levelHTTPS !== 'FALSE'
})

const emptyCtxMap = () => {
  Object.keys(ctxMap).forEach(key => {
    delete ctxMap[key]
  })
}

const updateRenewTime = (hostname, callback) => {
  Object.assign(renewTime, { [hostname]: Date.now() })
  fs.writeFile(renewTimeFile, JSON.stringify(renewTime), 'utf8', callback)
}

const updateCtxMap = (hostname, callback) => {
  const thisRenewTime = renewTime[hostname] || 0
  fs.readFile(`${pemdir}/${hostname}/pfx.pem`, (err, pfx) => {
    if (err) return callback(err)
    ctxMap[hostname] = tls.createSecureContext({ pfx })
    callback(null, ctxMap[hostname])
  })
}

const updateCert = (hostname, callback) => {
  // todo check rate limit
  if (Date.now() <= rateLimitPass) {
    console.log(`System pause renew method, please wait ${ms(rateLimitPass - Date.now())}`)
    return callback(new Error('System pause renew method'))
  }
  const thisPemDir = `${pemdir}/${hostname}`
  promisify(mkdirp)(thisPemDir).then(() => {
    return promisify(letiny.getCert)({
      email: process.env.HTTPS_EMAIL,
      domains: hostname, //'example.com,www.example.com',
      webroot: pemdir,
      pfxFile: `${thisPemDir}/pfx.pem`,
      certFile: `${thisPemDir}/cert.pem`,
      caFile: `${thisPemDir}/ca.pem`,
      privateKey: `${thisPemDir}/key.pem`,
      accountKey: `${thisPemDir}/account.pem`,
      agreeTerms: true
    })
  }).then(() => {
    return promisify(updateRenewTime)(hostname)
  }).then(() => {
    updateCtxMap(hostname, callback)
  }).catch(e => {
    if (e.message.indexOf('(429)') > -1) {
      rateLimitPass = Date.now() + ms('7d')
    }
    callback(e)
  })
}

const SNICallback = (hostname, callback) => {
  if (ctxMap[hostname]) return callback(null, ctxMap[hostname])
  if (!approvedDomains.includes(hostname)) {
    const error = new Error('Unapproved domain')
    error.name = 'ForbiddenError'
    return callback(error)
  }
  updateCtxMap(hostname, callback)
}

const SNIMiddleware = () => letiny.webrootChallengeMiddleware(pemdir)


module.exports = {
  updateCtxMap,
  SNICallback,
  updateCert,
  emptyCtxMap,
  SNIMiddleware
}
