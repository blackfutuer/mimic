import {isString, isFunction} from './type'
/**
 * @private
 * @param  {HTMLScriptElement} scr     script节点
 * @param  {String} url     资源地址
 * @param  {String} charset 字符集
 */
function appendScriptTag (scr, url, charset) {
  scr.setAttribute('type', 'text/javascript')
  charset && scr.setAttribute('charset', charset)
  scr.setAttribute('src', url)
  document.getElementsByTagName('head')[0].appendChild(scr)
}
/**
 * @private
 * @param  {HTMLScriptElement} scr script节点
 */
function removeScriptTag (scr) {
  if (scr && scr.parentNode) {
    scr.parentNode.removeChild(scr)
  }
  scr = null
}

export const IMG_1_1 = '//d00.sina.com.cn/a.gif'
  /**
   * 加载js模块
   * @param  {String} url          资源地址
   * @param  {Function} opt_callback 成功后回调方法
   * @param  {Object} opt_options  选项
   */
export function loadScript (url, optCallback, optOptions) {
  let scr = document.createElement('script')
  let scriptLoaded = 0
  let options = optOptions || {}
  let charset = options.charset || 'utf-8'
  let callback = optCallback || function () {}
  let timeout = options.timeout || 0
  let timer

  // IE和opera支持onreadystatechange
  // safari、chrome、opera支持onload
  scr.onload = scr.onreadystatechange = function () {
    // 避免opera下的多次调用
    if (scriptLoaded) {
      return
    }

    let readyState = scr.readyState
    if (
      typeof readyState === 'undefined' ||
      readyState === 'loaded' ||
      readyState === 'complete'
    ) {
      scriptLoaded = 1
      try {
        callback()
        clearTimeout(timer)
      } catch (e) {
        console.log(e.message)
      } finally {
        scr.onload = scr.onreadystatechange = null
        removeScriptTag(scr)
      }
    }
  }

  if (timeout) {
    timer = setTimeout(function () {
      scr.onload = scr.onreadystatechange = null
      removeScriptTag(scr)
      options.onfailure && options.onfailure()
    }, timeout)
  }

  appendScriptTag(scr, url, charset)
}
/**
 * jsonp方式回调
 * @param  {String}   url         资源地址
 * @param  {Function} callback    回调方法
 * @param  {Object}   opt_options 选项
 */
export function jsonp (url, callback, optOptions) {
  let scr = document.createElement('SCRIPT')
  let prefix = '_mimic_cbs_'
  let callbackName
  // let callbackImpl
  let options = optOptions || {}
  let charset = options.charset || 'utf-8'
  let queryField = options.queryField || 'callback'
  let timeout = options.timeout || 0
  let timer
  let reg = new RegExp('(\\?|&)' + queryField + '=([^&]*)')
  let matches

  function getCallBack (onTimeOut) {
    return function () {
      try {
        if (onTimeOut) {
          options.onfailure && options.onfailure()
        } else {
          callback.apply(window, arguments)
          clearTimeout(timer)
        }
      } catch (e) {
        console.log(e.message)
          // ignore the exception
      } finally {
        window[callbackName] = null
        delete window[callbackName]
        callbackName = null
        removeScriptTag(scr)
      }
    }
  }

  if (isString(callback)) {
    // 如果callback是一个字符串的话，就需要保证url是唯一的，不要去改变它
    // TODO 当调用了callback之后，无法删除动态创建的script标签
    callbackName = callback
  } else {
    if ((matches = reg.exec(url))) {
      callbackName = matches[2]
    }
  }

  if (!callbackName) {
    callbackName = prefix + Math.floor(Math.random() * 2147483648).toString(36)
  }

  if (isFunction(callback)) {
    window[callbackName] = getCallBack(0)
  }

  if (timeout) {
    timer = setTimeout(getCallBack(1), timeout)
  }

  // 如果用户在URL中已有callback，用参数传入的callback替换之
  url = url.replace(reg, '\x241' + queryField + '=' + callbackName)

  if (url.search(reg) < 0) {
    url += (url.indexOf('?') < 0 ? '?' : '&') + queryField + '=' + callbackName
  }
  appendScriptTag(scr, url, charset)
}

/**
 * 发送日志请求，使用sendBeacon，否则使用img
 * @param  {[type]} url    [description]
 * @param  {Object} params [description]
 * @param  {[type]} ts     [description]
 * @return {[type]}        [description]
 */
export function log (url, params = {}, ts) {
  let queryString = []
  ts && (params._mimic_ts = (+new Date()).toString(36))
  for (let key in params) {
    params[key] && queryString.push(`${key}=${encodeURIComponent(params[key])}`)
  }
  queryString = queryString.join('&')
  url = url + (
    queryString
      ? (url.indexOf('?') !== -1 ? '&' : '?') + queryString
      : ''
  )
  /* 暂时不用了，因为只能使用POST，业务原因，log平台大部分不支持POST */
  // if (false && navigator && navigator.sendBeacon) {
  //   // uc not enough arguments for sendBeacon bug
  //   // 加入一个空对象来解决
  //   navigator.sendBeacon(url, null)
  // } else {
  let key = 'mimic_imglog_' + (+new Date()).toString(36)
  let img = new Image()
  window[key] = img
  img.onload = img.onerror = img.onabort = function () {
    img.onload = img.onerror = img.onabort = null
    img = null
    window[key] = null
    delete window[key]
    key = null
  }
  img.src = url
  // }
}
