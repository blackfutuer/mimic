import {on} from './lib/event'
import {isString, isArray} from './lib/type'
import Slot from './Slot'

let serviceManager = {
  _serviceMapByName: {}, // {serviceName: service} 默认有sax service
  _isPageOnload: false // 记录页面是否已经加载完成，用在非异步渲染广告的情况
}
on(window, 'load', () => {
  serviceManager._isPageOnload = true
})

class Service {
  constructor () {
    this._isEnable = false
    this._slots = [] // 保存这个service下的slot的引用
    this._slotMapById = {}
    this._isStartCollapsed = true
    this._isCollapseEmpty = true
    this._isSingleRequest = false
    this._disableInitLoad = false // todo预先加载
    this._impl = null
  }
  enable () {
    this._isEnable = true
  }
  addSlot (slot) {
    if (!this._slotMapById[slot._id]) {
      this._slots.push(slot)
      this._slotMapById[slot._id] = slot
    }
  }
  getSlots () {
    return this._slots
  }
  fillSlot (slot) {
    let impl = this.getImpl()
    if (slot._isReady && slot._isFetchEnd) {
      impl.renderSlot(slot)
    } else {
      if (slot && this._slotMapById[slot._id] && !slot._data) {
        impl.request(slot)
      }
    }
  }
  refresh (optSlots = [], optOptions = {}) {
    optSlots = isArray(optSlots) ? optSlots : [optSlots]
    optSlots = optSlots.length > 0 ? optSlots : this.getSlots()
    let slots = []
    optSlots.forEach(slot => {
      if (isString(slot)) {
        slot = Slot.getSlotByDivId(slot)
      }
      if (slot) {
        slot._isFetchStart = false
        slot._isFetchEnd = false
        slot._data = null
      }
      slots.push(slot)
    })
    slots.forEach(slot => {
      this.fillSlot(slot)
    })
  }
  enableSingleRequest () {
    this._isSingleRequest = true
  }
  collapseEmptyDivs (startCollapsed) {}

  static get (name) {
    return isString(name) ? serviceManager._serviceMapByName[name] : serviceManager._serviceMapByName
  }
  static set (name, service) {
    serviceManager._serviceMapByName[name] = service
  }
  static isPageOnload () {
    return serviceManager._isPageOnload
  }
}

export default Service
