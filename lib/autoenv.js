const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const { homedir } = require("os")
const dotenv = require('dotenv')

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

if (!process.env.DATA_DIR) {
  process.env.DATA_DIR = path.resolve(
    process.env.NODE_ENV === 'production' ?
      homedir() :
      process.cwd(),
    './.youkuohao/tinyproxy'
  )
}

const { NODE_ENV, DATA_DIR } = process.env

global.__DEV__ = (NODE_ENV === 'development') || !(NODE_ENV === 'production')

const envPath = path.resolve(DATA_DIR, './.env')
if (dotenv.config({ path: envPath }).error) {
  const defaultEnv =
    `# gateway - tiny
CONFIG_FILE=./config.json
HTTPS_EMAIL=example@abc.com
`
  mkdirp.sync(`${DATA_DIR}/pem`)
  fs.writeFileSync(envPath, defaultEnv, 'utf8')
  dotenv.config({ path: envPath })
}

const configPath = path.resolve(DATA_DIR, './config.json')
try {
  fs.lstatSync(configPath)
} catch (e) {
  fs.writeFileSync(configPath, '{"domains": {}}', 'utf8')
}

const renewFile = path.resolve(DATA_DIR, './.renewTime.json')
try {
  fs.lstatSync(renewFile)
} catch (e) {
  fs.writeFileSync(renewFile, '{}', 'utf8')
}
