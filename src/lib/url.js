export function create (protocal, name, domain, port, path, query) {
  let url = ''
  protocal && (url += `${protocal}:`)
  if (domain) {
    url += '//'
    name && (url += `${name}@`)
    url += domain
    port && (url += `:${port}`)
  }
  path && (url += path)
  query && (url += `?${query}`)
  return url
}

const URLReg = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/
export function parse (url) {
  let match = url.match(URLReg)
  let URL
  if (match) {
    URL = {}
    ;['', 'protocal', 'name', 'domain', 'port', 'path', 'query', 'hash'].forEach((key, i) => {
      if (key && match[i]) {
        URL[key] = match[i]
      }
    })
  }
  return URL
}
export function appendQuery (url, querys) {
  let seg = url.indexOf('?') !== -1 ? '&' : '?'
  let queryString = []
  for (let key in querys) {
    queryString.push(`${key}=${encodeURIComponent(querys[key])}`)
  }
  return `${url}${seg}${queryString.join('&')}`
}
