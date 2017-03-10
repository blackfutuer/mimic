/**
 * @private
 * @param  {String} key 要验证的cookie的key
 * @return {Boolean}    是否为符合规则的key
 */
// http://www.w3.org/Protocols/rfc2109/rfc2109
// Syntax:  General
// The two state management headers, Set-Cookie and Cookie, have common
// syntactic properties involving attribute-value pairs.  The following
// grammar uses the notation, and tokens DIGIT (decimal digits) and
// token (informally, a sequence of non-special, non-white space
// characters) from the HTTP/1.1 specification [RFC 2068] to describe
// their syntax.
// av-pairs   = av-pair *(";" av-pair)
// av-pair    = attr ["=" value] ; optional value
// attr       = token
// value      = word
// word       = token | quoted-string

// http://www.ietf.org/rfc/rfc2068.txt
// token      = 1*<any CHAR except CTLs or tspecials>
// CHAR       = <any US-ASCII character (octets 0 - 127)>
// CTL        = <any US-ASCII control character
//              (octets 0 - 31) and DEL (127)>
// tspecials  = "(" | ")" | "<" | ">" | "@"
//              | "," | ";" | ":" | "\" | <">
//              | "/" | "[" | "]" | "?" | "="
//              | "{" | "}" | SP | HT
// SP         = <US-ASCII SP, space (32)>
// HT         = <US-ASCII HT, horizontal-tab (9)>
const KEY_REG = /^[^\x00-\x20\x7f()<>@,;:\\"[\]?={}/\u0080-\uffff]+\x24/
function _isValidKey (key) {
  return KEY_REG.test(key)
}
/**
 * 从cookie中获取key所对应的值
 * @private
 * @param  {String} key 要获取的cookie的key
 * @return {String}     cookie对应该key的值
 */
function _getRaw (key) {
  if (_isValidKey(key)) {
    let reg = new RegExp(`(^| )${key}=([^;]*)(;|\x24)`)
    let result = reg.exec(document.cookie)

    if (result) {
      return result[2] || null
    }
  }
  return null
}
/**
 * 将cookie中key的值设置为value, 并带入一些参数
 * @private
 * @param  {String} key 要设置的cookie的key
 * @param  {String} value 要设置的值
 * @param  {Object} options 选项
 */
function _setRaw (key, value, options) {
  if (!_isValidKey(key)) {
    return
  }

  options = options || {}

  // 计算cookie过期时间
  let expires = options.expires
  if (typeof options.expires === 'number') {
    expires = new Date()
    expires.setTime(expires.getTime() + options.expires)
  }

  document.cookie =
    `${key}=${value}` +
    (options.path ? `; path=${options.path}` : '') +
    (expires ? `; expires=${expires.toGMTString()}` : '') +
    (options.domain ? `; domain=${options.domain}` : '') +
    (options.secure ? `; secure` : '')
}
/**
 * 获取cookie中key的值
 * @param  {String} key 要获取的key
 * @return {String}     cookie值
 */
export function get (key) {
  let value = _getRaw(key)
  if (typeof value === 'string') {
    value = decodeURIComponent(value)
    return value
  }
  return null
}
/**
 * 设置cookie值
 * @param  {String} key     要设置的key
 * @param  {String} value   要设置的value
 * @param  {object} options 选项
 */
export function set (key, value, options) {
  _setRaw(key, encodeURIComponent(value), options)
}
/**
 * 移除key相关的cookie
 * @param  {String} key     要移除的cookie的key
 * @param  {Object} options 选项
 */
export function remove (key, options) {
  options = options || {}
  options.expires = new Date(0)
  _setRaw(key, '', options)
}
