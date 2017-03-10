/**
 * 判断是否是函数
 * @param  {Any}        source      需要判断的对象
 * @return {Boolean}                是否是函数
 * @staitc
 */
function isFunction (source) {
  return Object.prototype.toString.call(source) === '[object Function]'
}
/**
 * 判断是否是数组
 */
function isArray (source) {
  return Object.prototype.toString.call(source) === '[object Array]'
}
/**
 * 判断是否是字符串
 * @param  {Any} source 要判断的对象
 * @return {Boolean}        是否字符串
 * @static
 */
function isString (source) {
  return Object.prototype.toString.call(source) === '[object String]'
}

/**
 * 判断是否是数字
 */
function isNumber (source) {
  return Object.prototype.toString.call(source) && isFinite(source) === '[object Number]'
}

export {
  isFunction,
  isArray,
  isString,
  isNumber
}
