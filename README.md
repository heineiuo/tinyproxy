# tinyproxy

## Features

* HTTP(s)/WebScoket proxy
* DNS
* Service Registry
* Domain router settings and indexes

## About auth

* Allow verify token
* Deny sign token
* Deny username/password


## Documents

### Config file

```json5
{
  "domains": {
    // domain name
    "example.com": {
      /**
       * http:
       * proxy target
       */
      "http": "http://127.0.0.1",

      /**
       * levelHTTPS:
       * FALSE - do nothing, only support http protocol
       * HTTPS - support both http and https protocol
       * HTTPS_FORCE - only support https, auto redirect http to https
       */ 
      "levelHTTPS": "FALSE"
    }
  }
}
```
