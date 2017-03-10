import {isFunction} from './type'

export function on (el, type, fn) {
  el.addEventListener
    ? el.addEventListener(type, fn, false)
    : el.attachEvent && el.attachEvent(`on${type}`, fn)
}
export function off (el, type, fn) {
  el.removeEventListener
    ? el.removeEventListener(type, fn, false)
    : el.detachEvent && el.detachEvent(`on${type}`, fn)
}

// 冻结的全局变量，用来记录是否进入了bfc状态
window.mimic_bfc_cache_ts = +new Date()

class BFCacheCheck {
  constructor () {
    this.listeners = []
    this.init()
  }
  init () {
    // 默认启动timer监测
    // safari10 以后的版本通过后退按钮不触发pageshow, 所以不是很靠谱
    // http://stackoverflow.com/questions/10106457/pageshow-is-not-received-when-pressing-back-button-on-safari-on-ipad#
    // http://stackoverflow.com/questions/33804292/pageshow-event-on-safari/33804492
    if ('onpageshow' in window && 'onpagehide' in window) {
      on(window, 'pageshow', (e) => {
        if (e.persisted) {
          this.flush('PERSISTED')
        } else {
          let now = +new Date()
          let last = window.mimic_bfc_cache_ts
          if (now - last > 3000) {
            this.flush('DIFFTIMESTAMP')
          }
        }
      })
      on(window, 'pagehide', () => {
        window.mimic_bfc_cache_ts = +new Date()
      })
    } else {
      // diff 3000 完全是拍脑袋拍出来的，不要问我为什么，我也编不下去
      setInterval(() => {
        let now = +new Date()
        let last = window.mimic_bfc_cache_ts
        window.mimic_bfc_cache_ts = now
        if (now - last > 3000) {
          this.flush('DIFFTIMESTAMP')
        }
      }, 1000)
    }
  }
  push (cb) {
    this.listeners.push(cb)
  }
  flush (type) {
    this.listeners.forEach(cb => {
      isFunction(cb) && cb(type)
    })
  }
}

let _bfcCheck
export function onbfcache (cb) {
  ;(_bfcCheck || (_bfcCheck = new BFCacheCheck())).push(cb)
}
