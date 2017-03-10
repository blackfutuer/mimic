import {top} from './lib/tool'
import {parse} from './lib/url'

const URL = parse(top)

const SERVER = `${URL.protocal}://10.237.66.99`
const CDN = `${URL.protocal}://d1.sinaimg.cn/litong/mimic`
// csi 用来作为性能检测使用
// l:resource  资源加载性能指标
// l:slot  slot的生命周期
// l:mimic mimic整体的执行周期
export const CSI_REPORT_URL = `${SERVER}:3000/csi`
// rec 用来进行一些业务逻辑的监测
// 比如屏蔽监测，js报错监测等等
export const REC_REPORT_URL = `${SERVER}:3000/rec`

export const NATIVE_RESOURCE_URL = `${URL.protocal}://sax.sina.cn/native/impress`
export const COMPONENT_LIB_URL = `${CDN}/components/mimic-components.js`
export const PROMISE_POLLYFILL_URL = `${CDN}/pollyfill/es6-promise.min.js`
export const INTERSECTION_OBSERVER_POLLYFILL_URL = `${CDN}/pollyfill/IntersectionObserver.js`
