import {getCurrentScript, UserGrayScale} from './lib/tool'
import {loadScript} from './lib/sio'
import Commands from './Commands'
import {isArray, isString} from './lib/type'
import {getMimic, getPerf, setPropToMimic, getLogger, getSaxNativeService, updateCorrelator, isDebug} from './util'
import {COMPONENT_LIB_URL, PROMISE_POLLYFILL_URL, INTERSECTION_OBSERVER_POLLYFILL_URL} from './config'
import {onbfcache, on} from './lib/event'
import Slot from './Slot'
import Service from './Service'
import browser from './lib/browser'
const win = window

// 灰度
let isGrayUser = (new UserGrayScale(100)).check()
getLogger().log(`isGrayUser: ${isGrayUser}`)
getLogger().log(`browser: ${JSON.stringify(browser)}`)

// 如果没有Promise, 动态载入es6-promise, 然后开始所有的事情
if (!('Promise' in window)) {
  getLogger().log('mimic: need promise pollyfill')
  loadScript(PROMISE_POLLYFILL_URL, promisePollyfillReady)
} else {
  Promise.resolve().then(promisePollyfillReady)
}

function promisePollyfillReady () {
  let mimic = getMimic()
  if (!mimic.component) {
    setPropToMimic('component', COMPONENT_LIB_URL)
  }
  let deps = []
  // 如果没有IntersectionObserver原生支持，则载入
  if (!('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype)) {
    getLogger().log('mimic: need intersectionobserver pollyfill')
    deps.push(new Promise((resolve) => {
      loadScript(INTERSECTION_OBSERVER_POLLYFILL_URL, resolve)
    }))
  }
  // 这里可以加载其他的pollyfill
  //
  // 载入对应的展示组件
  deps.push(new Promise((resolve) => {
    loadScript(mimic.component, resolve)
  }))
  // 当所有依赖加载完成后开始广告脚本初始化
  Promise.all(deps).then(() => {
    getLogger().log('mimic:deps ready')
    if (win.mimic.evalScripts) {
      win.mimic.evalScripts()
    } else {
      setPropToMimic('evalScripts', evalScripts)
      bootstrap()
    }
  }, () => {
    getLogger().log('mimic: can not bootstrap')
  })
}

// 初始化mimic
// 主要是处理在脚本加载上来前的cmd的数组
// 并重载cmd.push供后续使用
function initMimic () {
  // 更新算子, 轮播数
  updateCorrelator()
  let mimic = getMimic()
  let prepareCmds = mimic.cmd
  if (!prepareCmds || isArray(prepareCmds)) {
    var cmds = mimic.cmd = new Commands()
    if (prepareCmds && prepareCmds.length > 0) {
      cmds.push.apply(cmds, prepareCmds)
    }
  }
}

// 入口函数
function bootstrap () {
  let mimic = getMimic()
  if (isDebug(win.location.href)) {
    // @TODO 设置一些跟debug相关的行为
  }
  // api: mimic.apiReady = true
  setPropToMimic('apiReady', true)

  // @Discuss:
  // 是否有必要防止一个配置项mimic.defer 控制脚本是否在DOMContentLoad的时候才进行初始化
  // 否则直接执行初始化
  mimic.defer && document.readyState !== 'complete'
    ? on(win, 'load', () => {
      win.setTimeout(() => {
        initMimic()
      }, 0)
    })
    : initMimic()

  // 检查是否bfcache
  onbfcache((type) => {
    let mimic = getMimic()
    // 默认backRefresh为空，如果不为空且为数组，刷新数组中的slot
    if (!mimic.backRefresh) {
      return
    }
    // 上线前记得把其他频道的给去了，只有sina.cn需要回退刷新
    try {
      updateCorrelator()
      Object.keys(Service.get()).forEach((name) => {
        let service = Service.get(name)
        service.refresh()
      })
    } catch (e) {
      getLogger().log('refresh error: ' + e.message)
    }
    getLogger().log('mimic:bfcache[' + type + ']' + JSON.stringify(mimic))
  })

  // @TODO
  // 进行相关网络联通性的上报
  getPerf().report(getCurrentScript())
  getPerf().report(PROMISE_POLLYFILL_URL)
  getPerf().report(INTERSECTION_OBSERVER_POLLYFILL_URL)
  getPerf().report(mimic.component)
  on(win, 'load', () => {
    getLogger().log('mimic:onload')
    getPerf().report()
  })
}

// 同步引入mimic.js的情况下执行mimic script节点中的内容，通过mimic_executed来防止重复执行
function evalScripts () {
  (document.getElementsByTagName('script') || []).forEach((script) => {
    let src = script.src
    if (src && src.indexOf('/mimic.js') !== -1 && script.innerHTML && !script.mimic_executed) {
      script.mimic_executed = true
      window['eval'](script.innerHTML)
    }
  })
}

// Mimic API
// 初始化saxService, 专门用于请求Sax广告
setPropToMimic('sns', getSaxNativeService)
setPropToMimic('defineSlot', Slot.createSlot)

setPropToMimic('enableServices', () => {
  Object.keys(Service.get()).forEach((name) => {
    let service = Service.get(name)
    service.enable()
  })
})
setPropToMimic('display', (div) => {
  let slot
  if (isString(div) && (slot = Slot.getSlotByDivId(div))) {
    slot._isReady = true
    slot.mark('r')
    if (slot._isAsyncRendering && !slot.hasWrapper()) {
      // 报错
    } else {
      slot._serviceList.forEach(service => {
        service._isEnable && service.fillSlot(slot)
      })
    }
  }
})
