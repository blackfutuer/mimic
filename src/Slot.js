import {isNumber, isString} from './lib/type'
import {log} from './lib/sio'
import {CSI_REPORT_URL} from './config'
import Perf from './Perf'
import {appendQuery} from './lib/url'

// 页面中生成的slot的缓存
let slotManager = {
  _slotMapByDivId: {}, // 按照divid => slot
  _slotMapByPdps: {}, // 按pdps => slots
  _slotCountMapByPdps: {}, // 按pdps => count
  _presistentMapById: {}, // slot id presistent
  _slots: []
}
// Slot
class Slot {
  constructor (pdps, pdpsCount, size, optDiv) {
    this._pdps = pdps
    // this._ui = null // 填充的展示实例
    this._pdpsCount = isNumber(pdpsCount) ? pdpsCount : 0
    this._id = `${this._pdps}_${this._pdpsCount}`
    this._domId = optDiv || `mimic_slot_${this._id}`
    this._isAsyncRendering = true // 默认是异步渲染
    this._isRemoved = false
    this._isReady = false
    this._isFetchStart = false
    this._isFetchEnd = false
    this._isComplete = false
    this._serviceList = []
    this._lifecycle = {
      r: 0, // ready
      fs: 0, // fetchStart
      fe: 0, // fetchEnd
      rs: 0, // renderStart
      re: 0, // renderEnd
      c: 0 // complete
    }
  }
  addService (service) {
    // 如果不在servie serviceManager中，报错
    // 如果已经存在slot.serviceList中，报错
    this._serviceList.push(service)
    // 然后把slot的相关属性添加到service中
    service.addSlot(this)
    return this
  }
  fetchStart () {
    this._isFetchStart = true
  }
  fetchEnded () {
    this._isFetchEnd = true
  }
  impressionViewable () {
    let viewables = this._data && this._data.vision
    if (viewables) {
      viewables.forEach((viewable) => {
        // 可见曝光增加可见时候距离页面打开的时间
        log(appendQuery(viewable, {pt: Perf.now()}))
      })
    }
  }
  impression () {
    let impressions = this._data && this._data.pvmonitor
    if (impressions) {
      impressions.forEach((impression) => {
        log(impression)
      })
    }
  }
  impressionPlay () {
    let plays = this._data && this._data.play
    if (plays) {
      plays.forEach(play => {
        log(appendQuery(play, {pl: 1}))
      })
    }
  }
  impressionPause () {
    let plays = this._data && this._data.play
    if (plays) {
      plays.forEach(play => {
        log(appendQuery(play, {pl: 2}))
      })
    }
  }
  hasWrapper () {
    return !!document.getElementById(this._domId)
  }

  static createSlot (pdps, size, optDiv) {
    if (!isString(pdps) || pdps.length <= 0 || !size) {
      return null
    }
    if (!(pdps in slotManager._slotMapByPdps)) {
      slotManager._slotMapByPdps[pdps] = []
      slotManager._slotCountMapByPdps[pdps] = 0
    }
    let slot = new Slot(pdps, slotManager._slotCountMapByPdps[pdps], size, optDiv)
    slotManager._slotCountMapByPdps[pdps]++
    optDiv = slot._domId
    if (slotManager._slotMapByDivId[optDiv]) {
      // 提示已经存在这个slot
      return null
    }
    slotManager._slotMapByPdps[pdps].push(slot)
    slotManager._slotMapByDivId[optDiv] = slot
    slotManager._slots.push(slot)
    return slot
  }
  profile () {
    let params = {
      l: 'slot',
      pdps: this._pdps,
      mem: Perf.getGlobalMemory()
    }
    for (let key in this._lifecycle) {
      params[key] = this._lifecycle[key]
    }
    log(CSI_REPORT_URL, params)
  }
  mark (key) {
    this._lifecycle[key] = Perf.now()
  }
  static getSlotByDivId (divId) {
    return slotManager._slotMapByDivId[divId]
  }
  static getSlotsByPdps (pdps) {
    return slotManager._slotMapByPdps[pdps]
  }
  static isPersistent (slot) {
    return slot._id in slotManager._presistentMapById
  }
  static persistent (slot) {
    slotManager._presistentMapById[slot._id] = null
  }
  static getSlots () {
    return slotManager._slots
  }
}

export default Slot
