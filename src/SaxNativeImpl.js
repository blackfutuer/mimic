import {getPerf, getGestureObserver, getViewabilityObserver, getLogger, getSaxNativeService, getCorrelator, isDebug} from './util'
import {getDom, top} from './lib/tool'
import {jsonp} from './lib/sio'
import {isArray, isFunction} from './lib/type'
import {NATIVE_RESOURCE_URL} from './config'
import Slot from './Slot'
import {on} from './lib/event'
import {get as getCookie} from './lib/cookie'
import {appendQuery} from './lib/url'

class SaxNativeImpl {
  constructor () {
    this._requestIndex = 0
    this._slotListMapByRequestIndex = {}
  }
  request (slot) {
    let slots = getSaxNativeService()._isSingleRequest
      ? getSaxNativeService().getSlots()
      : [slot]

    slots = slots.filter(slot => {
      return !slot._isFetchStart
    })

    if (slots.length > 0) {
      slots.forEach(slot => {
        slot.fetchStart()
      })
      // 获取当前impl.adData中还没有开始fetch的slot
      // 获取还没有开始fetch的slot中符合尺寸的slot
      let url = this.getRequestUrl({slots})
      this._slotListMapByRequestIndex[this._requestIndex] = slots
      if (!Slot.isPersistent(slots[0])) {
        getLogger().log('get ad' + (+new Date()))
        jsonp(
          url,
          ((requestIndex, url, response) => {
            getPerf().report(url)
            this.processResponse(response, requestIndex)
          }).bind(this, this._requestIndex++, url),
          {
            timeout: 3 * 1000,
            onfailure: ((url) => {
              getLogger().error({message: 'mimic: field', url: url})
            }).bind(this, url)
          }
        )
      }
    }
  }
  getRequestUrl (conf) {
    let host = NATIVE_RESOURCE_URL
    let params = {
      adunit_id: conf.slots.map((slot) => {
        slot.mark('fs')
        return slot._pdps
      }).join(),
      page_url: top,
      timestamp: new Date().getTime(),
      rotate_count: getCorrelator(),
      callback: 'mimic_cb_' + new Date().getTime().toString(36)
    }
    let queryString = []
    Object.keys(params).forEach(key => {
      let value = params[key]
      value && queryString.push(`${key}=${encodeURIComponent(value)}`)
    })
    return `${host}?${queryString.join('&')}`
  }
  renderSlot (slot) {
    // 如果有填充，那么调用填充的组件的销毁方法
    if (slot._ui && isFunction(slot._ui.destory)) {
      slot._ui.destory()
      delete slot._ui
    }
    let typeMap = {
      '31': 'card',
      '32': 'videocard',
      '61': 'card',
      '43': 'card2',
      '33': 'pic3',
      '35': 'bigpic',
      '36': 'tel',
      '37': 'callout',
      '38': 'download',
      '40': 'dynamicpic',
      '42': 'video',
      '34': 'nopic'
    }
    let slotDom
    let type
    if (
      slot._domId &&
      (slotDom = getDom(slot._domId)) &&
      slot._data &&
      slot._data.templateid &&
      // 如果具有NPIC的cookie，那么全部使用无图模板
      (type = getCookie('NPIC') ? 'nopic' : typeMap[slot._data.templateid])
    ) {
      slot.mark('rs')
      // 为广告加上点击坐标替换, 只在第一次初始化slot的时候加上
      if (!slot._isInterceptClick) {
        on(slotDom, 'mousedown', function (e) {
          let tar = e.target
          let url
          while (tar && tar !== this) {
            if (tar && (tar.tagName.toUpperCase() === 'A') && (url = tar.getAttribute('mimic-url'))) {
              // 加入点击坐标
              tar.setAttribute('href', appendQuery(url, {am: `{clkx:${e.pageX},clky:${e.pageY}}`}))
            }
            tar = tar.parentNode
          }
        })
        // 设置debug手势方法, 只在第一次初始化slot的时候加上
        getGestureObserver().observe(slotDom)
        slot._isInterceptClick = true
      }
      // 发送曝光
      slot.impression()
      // 实例化feed component
      console.log(type)
      let listeners = {}
      // 如果是video需要增加播放监测
      if (type === 'video') {
        listeners.play = function () {
          let slot = Slot.getSlotByDivId(this.getDomId())
          slot && slot.impressionPlay()
        }
        listeners.pause = function () {
          let slot = Slot.getSlotByDivId(this.getDomId())
          slot && slot.impressionPause()
        }
      }
      slot._ui = new SinaAD[type]({el: slotDom, data: slot._data, listeners})
      // 监测当前slot的可见曝光
      getViewabilityObserver().observe(slotDom)
      slot.mark('re')
      // 存在profile字段，表明需要上载广告位的生命周期信息
      if (slot._data._profile_ || isDebug()) {
        slot.profile()
      }
    }
  }
  processResponse (response, requestIndex) {
    var slots = this._slotListMapByRequestIndex[requestIndex]
    slots = this.setResponseToSlots(response, slots)
    delete this._slotListMapByRequestIndex[requestIndex]
    slots.forEach((slot) => {
      slot.mark('fe')
      if (slot._isReady) {
        this.renderSlot(slot)
      }
    })
  }

  setResponseToSlots (response, slots) {
    if (!isArray(response)) {
      response = [response]
    }
    let result = []
    let resMap = {}
    response.forEach(data => {
      resMap[data.pdps] = data
    })
    slots.forEach(slot => {
      let data = resMap[slot._pdps] || null
      if (data) {
        slot._data = data
        slot.fetchEnded()
        if (data._cookies_) {
          // do sth
        }
        if (data._persistent_) {
          Slot.persistent(slot)
        }
        result.push(slot)
      }
    })
    return result
  }
}

export default SaxNativeImpl
