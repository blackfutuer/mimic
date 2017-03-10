import {top} from './lib/tool'
import {log} from './lib/sio'
import {isString} from './lib/type'
function getGlobalTiming (win = window) {
  let res
  let timing
  if (win.performance && (timing = win.performance.timing)) {
    res = {}
    try {
      // 因为响应的同时就会进行解析，所以把reponse的时间计算进来
      res.load = Math.floor(timing.loadEventStart - timing.responseStart)
      // 【重要】解析 DOM 树结构的时间
      // 【原因】反省下你的 DOM 树嵌套是不是太多了
      res.ready = Math.floor(timing.domContentLoadedEventEnd - timing.responseStart)
      // 【重要】DNS 查询时间
      // 【原因】DNS 预加载做了么？页面内是不是使用了太多不同的域名导致域名查询的时间太长？
      //  可使用 HTML5 Prefetch 预查询 DNS ，见：[HTML5 prefetch](http://segmentfault.com/a/1190000000633364)
      res.dns = Math.floor(timing.domainLookupEnd - timing.domainLookupStart)
      // 【重要】读取页面第一个字节的时间
      // 【原因】这可以理解为用户拿到你的资源占用的时间，加异地机房了么，加CDN 处理了么？加带宽了么？加 CPU 运算速度了么？
      //  TTFB 即 Time To First Byte 的意思
      //  维基百科：https://en.wikipedia.org/wiki/Time_To_First_Byte
      res.ttfb = Math.floor(timing.responseStart - timing.navigationStart)
      // 【重要】内容加载完成的时间
      // 【原因】页面内容经过 gzip 压缩了么，静态资源 css/js 等压缩了么？
      res.content = Math.floor(timing.responseEnd - timing.requestStart)
      // TCP 建立连接完成握手的时间
      res.tcp = Math.floor(timing.connectEnd - timing.connectStart)
      res.dur = Math.floor(timing.responseEnd - timing.navigationStart)
    } catch (e) {}
  }
  return res
}

function getPageT (win = window) {
  let pt
  try {
    pt = (
      (win.chrome && win.chrome.csi && Math.floor(win.chrome.csi().pageT)) ||
      (win.gtbExternal && window.gtbExternal.pageT()) ||
      (win.external && window.external.pageT)
    )
  } catch (e) {}
  return pt
}
function getEntryPref (entryName, win = window) {
  let entry
  let res
  if (win.performance && win.performance.getEntriesByName && (entry = win.performance.getEntriesByName(entryName)[0])) {
    res = {}
    res.st = Math.floor(entry.startTime)
    res.fs = Math.floor(entry.fetchStart)
    if (entry.responseStart > 0) {
      res.dns = Math.floor(entry.domainLookupEnd - entry.domainLookupStart)
      res.tcp = Math.floor(entry.connectEnd - entry.connectStart)
      if (entry.secureConnectionStart) {
        res.ssl = Math.floor(entry.connectEnd - entry.secureConnectionStart)
      }
      res.ttfb = Math.floor(entry.responseStart - entry.fetchStart)
      res.content = Math.floor(entry.responseEnd - entry.responseStart)
    }
    res.dur = Math.floor(entry.duration)
  }
  return res
}

/**
 * 性能监测代码
 */

let startTime = window.performance ? (window.performance.navigationStart || window.performance.fetchStart) : Date.now()

class Perf {
  constructor (url) {
    this.reciveUrl = url
  }
  // 获取当前时间到页面加载事件差，作为记录当前事件触发时间
  static now () {
    let pageT = getPageT(window)
    return pageT || (window.performance && window.performance.now ? window.performance.now() : Date.now() - startTime)
  }
  static getGlobalMemory () {
    return (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) || 0
  }
  report (entryName, win = window) {
    let res
    let target
    if (!isString(arguments[0])) {
      win = entryName
      target = 'global'
      res = getGlobalTiming(win)
    } else {
      target = entryName.split('?')[0].replace(/^(http|https):\/\//, '')
      res = getEntryPref(entryName, win)
    }
    if (res) {
      res.l = 'resource'
      res.tg = target
      res.pt = this.constructor.now()
      res.mem = this.constructor.getGlobalMemory(win)
      res.top = top
      log(this.reciveUrl, res)
    }
  }
}

export default Perf

// 各个属性参考
// // 获取 performance 数据
// var performance = {
//     // memory 是非标准属性，只在 Chrome 有
//     // 财富问题：我有多少内存
//     memory: {
//         usedJSHeapSize:  16100000, // JS 对象（包括V8引擎内部对象）占用的内存，一定小于 totalJSHeapSize
//         totalJSHeapSize: 35100000, // 可使用的内存
//         jsHeapSizeLimit: 793000000 // 内存大小限制
//     },

//     //  哲学问题：我从哪里来？
//     navigation: {
//         redirectCount: 0, // 如果有重定向的话，页面通过几次重定向跳转而来
//         type: 0           // 0   即 TYPE_NAVIGATENEXT 正常进入的页面（非刷新、非重定向等）
//                           // 1   即 TYPE_RELOAD       通过 window.location.reload() 刷新的页面
//                           // 2   即 TYPE_BACK_FORWARD 通过浏览器的前进后退按钮进入的页面（历史记录）
//                           // 255 即 TYPE_UNDEFINED    非以上方式进入的页面
//     },

//     timing: {
//         // 在同一个浏览器上下文中，前一个网页（与当前页面不一定同域）unload 的时间戳，如果无前一个网页 unload ，则与 fetchStart 值相等
//         navigationStart: 1441112691935,

//         // 前一个网页（与当前页面同域）unload 的时间戳，如果无前一个网页 unload 或者前一个网页与当前页面不同域，则值为 0
//         unloadEventStart: 0,

//         // 和 unloadEventStart 相对应，返回前一个网页 unload 事件绑定的回调函数执行完毕的时间戳
//         unloadEventEnd: 0,

//         // 第一个 HTTP 重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0
//         redirectStart: 0,

//         // 最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为 0
//         redirectEnd: 0,

//         // 浏览器准备好使用 HTTP 请求抓取文档的时间，这发生在检查本地缓存之前
//         fetchStart: 1441112692155,

//         // DNS 域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
//         domainLookupStart: 1441112692155,

//         // DNS 域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
//         domainLookupEnd: 1441112692155,

//         // HTTP（TCP） 开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等
//         // 注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间
//         connectStart: 1441112692155,

//         // HTTP（TCP） 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等
//         // 注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间
//         // 注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过
//         connectEnd: 1441112692155,

//         // HTTPS 连接开始的时间，如果不是安全连接，则值为 0
//         secureConnectionStart: 0,

//         // HTTP 请求读取真实文档开始的时间（完成建立连接），包括从本地读取缓存
//         // 连接错误重连时，这里显示的也是新建立连接的时间
//         requestStart: 1441112692158,

//         // HTTP 开始接收响应的时间（获取到第一个字节），包括从本地读取缓存
//         responseStart: 1441112692686,

//         // HTTP 响应全部接收完成的时间（获取到最后一个字节），包括从本地读取缓存
//         responseEnd: 1441112692687,

//         // 开始解析渲染 DOM 树的时间，此时 Document.readyState 变为 loading，并将抛出 readystatechange 相关事件
//         domLoading: 1441112692690,

//         // 完成解析 DOM 树的时间，Document.readyState 变为 interactive，并将抛出 readystatechange 相关事件
//         // 注意只是 DOM 树解析完成，这时候并没有开始加载网页内的资源
//         domInteractive: 1441112693093,

//         // DOM 解析完成后，网页内资源加载开始的时间
//         // 在 DOMContentLoaded 事件抛出前发生
//         domContentLoadedEventStart: 1441112693093,

//         // DOM 解析完成后，网页内资源加载完成的时间（如 JS 脚本加载执行完毕）
//         domContentLoadedEventEnd: 1441112693101,

//         // DOM 树解析完成，且资源也准备就绪的时间，Document.readyState 变为 complete，并将抛出 readystatechange 相关事件
//         domComplete: 1441112693214,

//         // load 事件发送给文档，也即 load 回调函数开始执行的时间
//         // 注意如果没有绑定 load 事件，值为 0
//         loadEventStart: 1441112693214,

//         // load 事件的回调函数执行完毕的时间
//         loadEventEnd: 1441112693215

//         // 字母顺序
//         // connectEnd: 1441112692155,
//         // connectStart: 1441112692155,
//         // domComplete: 1441112693214,
//         // domContentLoadedEventEnd: 1441112693101,
//         // domContentLoadedEventStart: 1441112693093,
//         // domInteractive: 1441112693093,
//         // domLoading: 1441112692690,
//         // domainLookupEnd: 1441112692155,
//         // domainLookupStart: 1441112692155,
//         // fetchStart: 1441112692155,
//         // loadEventEnd: 1441112693215,
//         // loadEventStart: 1441112693214,
//         // navigationStart: 1441112691935,
//         // redirectEnd: 0,
//         // redirectStart: 0,
//         // requestStart: 1441112692158,
//         // responseEnd: 1441112692687,
//         // responseStart: 1441112692686,
//         // secureConnectionStart: 0,
//         // unloadEventEnd: 0,
//         // unloadEventStart: 0
//     }
// };
