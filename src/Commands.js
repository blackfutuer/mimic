import {isFunction} from './lib/type'
import {getLogger} from './util'
// 命令对象
class Commands {
  constructor () {
    this._success = 0
    this._error = 0
  }
  push () {
    for (let i = 0; i < arguments.length; ++i) {
      try {
        if (isFunction(arguments[i])) {
          arguments[i]()
          this._success++
        }
      } catch (e) {
        getLogger().log(e.message)
        this._error++
      }
    }
    return this.success
  }
}

export default Commands
