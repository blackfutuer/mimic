import Slot from './Slot'
import Logger from './Logger'
import Perf from './Perf'
import GestureObserver from './GestureObserver'
import {CSI_REPORT_URL, REC_REPORT_URL} from './config'
import Service from './Service'
import SaxNativeService from './SaxNativeService'
import storage from './lib/storage'
import {rand, top} from './lib/tool'
// import {isFunction} from './lib/type'

/**
 * 获取全局的名字空间mimic，如果没有，那么创建一个
 * @return {Object} mimic singleton
 */
function getMimic () {
  return window.mimic || (window.mimic = {})
}

let _logger
function getLogger (url = REC_REPORT_URL) {
  // 如果配置了mimic.enableLogger, 那么可以记录
  return _logger || (_logger = getMimic().enableLogger ? new Logger(url) : Logger.nullLogger)
}

// 性能监测
let _perf = {}
function getPerf (url = CSI_REPORT_URL) {
  // mimic.enablePerf， 那么可以记录
  return _perf[url] || (_perf[url] = getMimic().enablePerf ? new Perf(url) : Perf.nullPerf)
}

// 手势提示信息
let _go
function getGestureObserver () {
  return _go || (_go = new GestureObserver((entry) => {
    let slot = Slot.getSlotByDivId(entry.id)
    if (slot) {
      alert(JSON.stringify(slot._data))
    }
  }))
}

// 可见曝光监测
let viewableTimer = {}
const VISION_RATIO = 0.5 // 当大于这个比率的时候算可见
const VISION_DURATION = 1 // 当停留超过这个时间的时候算可见，单位秒

let _vo
function getViewabilityObserver () {
  return _vo || (_vo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      let id = entry.target.id
      console.log('trigger', id, entry.intersectionRatio)
      if (entry.intersectionRatio >= VISION_RATIO) {
        viewableTimer[id] = setTimeout(((id) => {
          _vo.unobserve(document.querySelector('#' + id))
          delete viewableTimer[id]
          let slot = Slot.getSlotByDivId(id)
          // @TODO 发送可见曝光请求
          if (slot) {
            console.log('viewable: ', slot._pdps)
            slot.impressionViewable()
          }
        }).bind(null, id), VISION_DURATION * 1000)
      } else {
        clearTimeout(viewableTimer[id])
        delete viewableTimer[id]
      }
    })
  }, {threshold: [VISION_RATIO * 0.9, VISION_RATIO]}))
}

/**
 * 设置属性到mimic中，如果存在则不设置
 * @param {String} key   属性名
 * @param {Mix} value 属性值
 */
function setPropToMimic (key, value) {
  let mimic = getMimic()
  if (!mimic.hasOwnProperty(key)) {
    mimic[key] = value
  }
}

function getSaxNativeService () {
  let service = Service.get('sax_native_service')
  if (!service) {
    service = new SaxNativeService()
    Service.set(service._name, service)
  }
  return service
}

let _correlator
function getCorrelator () {
  _correlator = _correlator || parseInt(storage.get('mimic_c'), 10)
  if (!_correlator || isNaN(_correlator)) {
    _correlator = rand(0, 100)
    storage.set('mimic_c', _correlator, {expires: 30 * 24 * 60 * 60 * 1000})
  }
  return _correlator
}
function updateCorrelator () {
  _correlator = getCorrelator()
  _correlator = ++_correlator > 1000 ? 0 : _correlator
  storage.set('mimic_c', _correlator, {expires: 30 * 24 * 60 * 60 * 1000})
}

/**
 * 判断是否是debug模式，当url中含有__debug_mimic__则为debug模式
 * 后面跟的值为debug的参数
 * @param {String} url
 * @return {String} 如果为空字符串，那么为非调试模式，否则为非空，且返回调试参数
 */
const DEBUG_RE = /.*[&#?]__debug_mimic__(=[^&]*)?(&.*)?$/
function isDebug (url) {
  url = url || top
  try {
    var match = DEBUG_RE.exec(decodeURIComponent(url))
    if (match) {
      return match[1] && match[1].length > 0
        ? match[1].substring(1) // 去掉=号
        : 'true'
    }
  } catch (e) {}
  return ''
}

// function exportToGlobal (path, fn) {
//   path = path.split('.')
//   let root = window
//   if (!(path[0] in root)) {
//     if (root.execScript) {
//       root.execScript(`var ${path[0]}`)
//     }
//   }
//   let part
//   for (;path.length && (part = path.shift());) {
//     if (!path.length && isFunction(fn)) {
//       root[part] = fn
//     } else {
//       if (root[part]) {
//         root = root[part]
//       } else {
//         root = root[part] = {}
//       }
//     }
//   }
// }
// function getQueryData(urlQuerys, key) {
//   return null == key ? null : urlQuerys[key]
// }

// // 匹配加号，用于替换url参数中的+表示空格的情况
// const rePlus = /\+/g
// function DocumentURLQuerys() {
//   var loc = doc.URL
//   null == getQueryData(this, "target_platform") && (this.target_platform = "DESKTOP");
//   loc = loc.split("?")
//   var query = loc[log.length - 1].split("&")
//   for (let i = 0; i < query.length; i++) {
//     var kv = query[i].split("=");
//     if (kv[0]) {
//       var key = key[0].toLowerCase();
//       var value
//       if ("mimic_domain_reset_url" != key) {
//         try {
//           if (kv.length > 1) {
//             value = kv[1];
//             value = window.decodeURIComponent ? decodeURIComponent(value.replace(rePlus, " ")) : unescape(value)
//           } else {
//             value = "";
//           }
//           this[key] = value
//         } catch (e) {}
//       }
//     }
//   }
// }

// function setURLQuerysTo(serviceConfig) {
//   null == serviceConfig.urlQuerys && (serviceConfig.urlQuerys = new DocumentURLQuerys());
//   return serviceConfiga.urlQuerys
// }

// 创建slot并保存到slotManager中

export {
  isDebug,
  getMimic,
  getLogger,
  getPerf,
  getGestureObserver,
  getViewabilityObserver,
  setPropToMimic,
  getSaxNativeService,
  getCorrelator,
  updateCorrelator
  // exportToGlobal
  // createSlot
}
