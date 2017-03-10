import {log} from './lib/sio'
import {isString} from './lib/type'

function formatParams (params) {
  if (isString(params)) {
    params = {message: params}
  }
  return params
}
class Logger {
  constructor (url) {
    this._reportUrl = url + (url.indexOf('?') !== -1 ? '&' : '?')
  }
  log (params) {
    console.log(params)
    log(this._reportUrl + 't=log', formatParams(params))
  }
  info (params) {
    console.info(params)
    log(this._reportUrl + 't=info', formatParams(params))
  }
  error (params) {
    console.error(params)
    log(this._reportUrl + 't=err', formatParams(params))
  }
}

export default Logger
