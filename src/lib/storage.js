import * as cookie from './cookie'
import {now} from './tool'
// 关闭浏览器后过期的key
var _sessionStorageMap = {}

/**
 * localstorage相关方法
 */
let ls = {
  get (key) {
    if (_sessionStorageMap[key]) {
      return window.sessionStorage.getItem(key)
    }
    let value = window.localStorage.getItem(key)
    if (value) {
      value = value.split(';expires=')
      // 有过期时间
      if (value[1] && now() > parseInt(value[1], 10)) {
        window.localStorage.removeItem(key)
        return null
      } else {
        return value[0]
      }
    }
  },
  set (key, value, options = {}) {
    if (!options.expires) {
      _sessionStorageMap[key] = 1
      window.sessionStorage.setItem(key, value)
    } else {
      window.localStorage.setItem(key, value + (options.expires ? ';expires=' + (now() + options.expires) : ''))
    }
  },
  remove (key) {
    if (_sessionStorageMap[key]) {
      delete _sessionStorageMap[key]
      window.sessionStorage.removeItem(key)
    } else {
      window.localStorage.removeItem(key)
    }
  }
}

/**
 * 根据浏览器支持选择相关的存储方案
 * 隐私模式下storage会写入失败
 */
let storage = window.localStorage ? ls : cookie

/**
 * 测试storage是否成功，隐私模式下localstorage会失败
 */
try {
  storage.set('mimi_lib_test_ls', 'support')
} catch (e) {
  storage = cookie
}

export default storage
