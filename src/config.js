import {top, rand} from './lib/tool'
import {parse} from './lib/url'
import {get as getCookie} from './lib/cookie'

const URL = parse(top)
const SERVER = `${URL.protocal}://csi.sina.cn`
const CDN = `${URL.protocal}://d${rand(0, 9)}.sinaimg.cn/litong/mimic`
// csi 用来作为性能检测使用
// l:resource  资源加载性能指标
// l:slot  slot的生命周期
// l:mimic mimic整体的执行周期
export const CSI_REPORT_URL = `${SERVER}/csi`
// rec 用来进行一些业务逻辑的监测
// 比如屏蔽监测，js报错监测等等
export const REC_REPORT_URL = `${SERVER}/rec`

export const BACKUP_NATIVE_RESOURCE_URL_LIST = [
  // 'sax.sina.com.cn',
  'sax.sina.cn'
].concat(
  []
  // 加入sax0-9.sina.com.cn
  // 20170506 sax0-9都被封禁了
  // Array.apply(null, new Array(10)).map((item, i) => {
  //   return `sax${i}.sina.cn`
  // })
  // // 加入sax0-9.sina.cn
  // Array.apply(null, new Array(10)).map((item, i) => {
  //   return `sax${i}.sina.cn`
  // })
)
export const DEFAULT_NATIVE_RESOURCE_URL = `${URL.protocal}://sax.sina.cn/ssp/wap/native`
export const NATIVE_RESOURCE_URL = `${URL.protocal}://${getCookie('ANTI_ADB_HOST') || BACKUP_NATIVE_RESOURCE_URL_LIST[rand(0, BACKUP_NATIVE_RESOURCE_URL_LIST.length - 1)]}/native/impress`
export const COMPONENT_LIB_URL = `${CDN}/components/mimic-components.js`
export const PROMISE_POLLYFILL_URL = `${CDN}/pollyfill/es6-promise.min.js`
export const INTERSECTION_OBSERVER_POLLYFILL_URL = `${CDN}/pollyfill/IntersectionObserver.js`
export const AUTHOR_INFO = '期待你的加入，简历请投：acelan(xiaobin8[at]staff.sina.cn)'
