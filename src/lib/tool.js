import {isString, isFunction} from './type'
import {get as getCookie} from './cookie'

const win = window

export const top = (() => {
  let top
  try {
    top = window.top.location.href
  } catch (e) {}
  top = top || ((window.top === window.self) ? window.location.href : window.document.referrer)
  return top
})()

export function now () {
  return +new Date()
}

export function rand (min, max) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

export function getDom (el, owerDoc = document) {
  return isString(el) ? owerDoc.getElementById(el) : el
}

export function exportToGlobal (path, fn) {
  path = path.split('.')
  var root = win
  if (!(path[0] in root)) {
    if (root.execScript) {
      root.execScript('var ' + path[0])
    }
  }
  var part
  for (;path.length && (part = path.shift());) {
    if (!path.length && isFunction(fn)) {
      root[part] = fn
    } else {
      if (root[part]) {
        root = root[part]
      } else {
        root = root[part] = {}
      }
    }
  }
}

export function getCurrentScript () {
  // 取得正在解析的script节点
  if (document.currentScript) { // firefox 4+
    return document.currentScript.src
  }
  // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
  var stack
  try {
    window.b.c() // 强制报错,以便捕获e.stack
  } catch (e) { // safari的错误对象只有line,sourceId,sourceURL
    stack = e.stack
    if (!stack && window.opera) {
      // opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
      stack = (String(e).match(/of linked script \S+/g) || []).join(' ')
    }
  }
  if (stack) {
    /**
     * e.stack最后一行在所有支持的浏览器大致如下:
     * chrome23:
     * at http://domain.com/data.js:4:1
     * firefox17:
     * @http://domain.com/data.js:4
     * opera12:
     * @http://domian.com/data.js:4
     * IE10:
     * at Global code (http://domain.com/data.js:4:1)
     */
    stack = stack.split(/[@ ]/g).pop() // 取得最后一行,最后一个空格或@之后的部分
    stack = stack[0] === '(' ? stack.slice(1, -1) : stack
    return stack.replace(/(:\d+)?:\d+$/i, '') // 去掉行号与或许存在的出错字符起始位置
  }
  var nodes = document.getElementsByTagName('script') // 只在head标签中寻找
  for (let i = 0, node; (node = nodes[i++]);) {
    if (node.readyState === 'interactive') {
      return (node.className = node.src)
    }
  }
}

// 预取一些资源
export function prefetch (url) {
  let head = document.getElementsByTagName('head')[0]
  let link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  head && head.appendChild(link)
}

/**
 * 把一个字符串生成唯一hash
 * @param  {String} s 要生成hash的字符串
 * @return {String}   36进制字符串
 */
function hash (s) {
  let hash = 0
  let i = 0
  let w
  for (; !isNaN(w = s.charCodeAt(i++));) {
    hash = ((hash << 5) - hash) + w
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// 灰度测试判断方法
class ListGrayScale {
  constructor (list = []) {
    this.list = list
  }
  check (key) {
    return this.list.indexOf(key) !== -1
  }
}
// 指定用户ustat -> ustat灰度
// scale 为0-100的数字
class UserGrayScale {
  constructor (scale = 0, ustats = []) {
    let ustat = getCookie('ustat')
    this.gray = ustat
      ? (new ListGrayScale(ustats)).check(ustat) || (scale > 0 ? parseInt(hash(ustat), 36) % 100 <= scale : false)
      : false
  }
  check () {
    return this.gray
  }
}
export {ListGrayScale, UserGrayScale}
