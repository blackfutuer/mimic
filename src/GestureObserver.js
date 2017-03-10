import {on, off} from './lib/event'
import {isString, isFunction} from './lib/type'
import {getDom} from './lib/tool'

let pos = {} // 记录滑动的信息
let count = 0 // 记录滑动次数
const DISTANCE = 50 // 来回滑动的最大距离
const TIMES = 5 // 来回滑动的次数

function onTouchStart (e) {
  let point = e.touches ? e.touches[0] : e
  pos._start = point.screenX
  pos._lastDelta = 0
  pos._dir = 0
  on(e.target, 'touchmove', onTouchMove)
}

function onTouchMove (e) {
  let point = e.touches ? e.touches[0] : e
  let delta = point.screenX - pos._start
  let dir = delta / Math.abs(delta)

  // console.log(count, 'dir', dir, 'delta',delta, ' | ', pos.dir, pos.lastDelta)
  if (dir !== pos._dir && pos._lastDelta > DISTANCE) {
    pos._dir = dir
    pos._start = point.screenX
    count++
  } else {
    pos._lastDelta = Math.abs(delta)
  }
}

function onTouchEnd (e, dom, cb) {
  if (count >= TIMES) {
    console.log('debug mode trigger')
    cb(dom)
  }
  pos = {}
  count = 0
}

// debug监测
class GestureInfo {
  constructor (cb) {
    this._cb = cb
  }
  observe (dom) {
    dom = isString(dom) ? getDom(dom) : dom
    if (dom && isFunction(this._cb)) {
      on(dom, 'touchstart', onTouchStart)
      on(dom, 'touchend', (e) => {
        onTouchEnd(e, dom, this._cb)
        off(e.target, 'touchmove', onTouchMove)
      })
    }
  }
}

export default GestureInfo
