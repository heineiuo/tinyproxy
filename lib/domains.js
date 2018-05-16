const _fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const parseDomain = require('parse-domain')
const { promisify } = require('util')

const fs = {
  readFile: promisify(_fs.readFile)
}

class Domains extends EventEmitter {
  constructor() {
    super()
    this.domains = {}

    process.nextTick(async () => {
      try {
        await this.parseFile('./config.json')
      } catch (e) {
        console.log(`[${new Date()}] Parse config file failed: ${e.stack}`)
      }
    })
  }

  reset() {
    Object.keys(this.domains).forEach(k => delete this.domains[k])
    return this
  }


  /**
   * @name getWildcardDomain
   * @param {*} hostname 
   */
  getWildcardDomain(hostname) {
    const parsed = parseDomain(hostname)
    if (!parsed) return `*.${hostname}`
    const { subdomain, domain: rootdomain, tld } = parsed
    const subdomainSplited = subdomain.split('.')
    const sld = subdomainSplited[subdomainSplited.length - 1]
    return `${sld === '' ? '*' : `*.${sld}`}.${rootdomain}.${tld}`
  }

  /**
   * @name getDomainFromRequest
   * @param {*} req 
   * @param {*} protocol 
   */
  getDomainFromRequest(req, protocol = ['http']) {
    // const fullUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`
    // const { hostname, pathname } = new URL(fullUrl)

    const hostname = req.headers.host.split(':')[0]
    let targetHostname = null
    let wildcardDomain = null

    if (this.domains.hasOwnProperty(hostname)) {
      targetHostname = hostname
    } else {
      wildcardDomain = this.getWildcardDomain(hostname)
      if (this.domains.hasOwnProperty(wildcardDomain)) {
        targetHostname = wildcardDomain
      }
    }

    return targetHostname
  }

  /**
   * @name get
   * @summary query domains
   */
  get() {
    return this.domains
  }


  /**
   * @name parseFile
   * @param {*} localFilePath 
   * @param {*} reset 
   */
  async parseFile(localFilePath, reset) {
    const absoluteLocalFilePath = path.isAbsolute(localFilePath) ?
      localFilePath :
      path.resolve(process.env.DATA_DIR, localFilePath)
    const content = await fs.readFile(absoluteLocalFilePath, 'utf8')
    const json = JSON.parse(content)
    if (reset) {
      this.reset()
    }

    Object.assign(this.domains, json)
    console.log(`[${new Date()}] Domain config updated: ${JSON.stringify(this.domains, 2, 2)}`)
    this.emit('change', this.domains)
  }
}

module.exports = new Domains()
