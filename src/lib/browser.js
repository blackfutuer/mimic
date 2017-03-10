import {isArray} from './type'

const ua = navigator.userAgent
const REGX_MAP = [
  [
    // Presto based
    /(opera\smini)\/([\w.-]+)/i,                                       // Opera Mini
    /(opera\s[mobiletab]+).+version\/([\w.-]+)/i,                      // Opera Mobi/Tablet
    /(opera).+version\/([\w.]+)/i,                                     // Opera > 9.80
    /(opera)[/\s]+([\w.]+)/i                                          // Opera < 9.80
  ], ['name', 'version'],
  [
    /(opios)[/\s]+([\w.]+)/i                                          // Opera mini on iphone >= 8.0
  ], [['name', 'Opera Mini'], 'version'],
  [
    /\s(opr)\/([\w.]+)/i                                               // Opera Webkit
  ], [['name', 'Opera'], 'version'],
  [
    // Mixed
    /(kindle)\/([\w.]+)/i,                                             // Kindle
    /(lunascape|maxthon|netfront|jasmine|blazer)[/\s]?([\w.]+)*/i,    // Lunascape/Maxthon/Netfront/Jasmine/Blazer
    // Trident based
    /(avant\s|iemobile|slim|baidu)(?:browser)?[/\s]?([\w.]*)/i,       // Avant/IEMobile/SlimBrowser/Baidu
    /(?:ms|\()(ie)\s([\w.]+)/i,                                        // Internet Explorer
    // Webkit/KHTML based
    /(rekonq)\/([\w.]+)*/i,                                            // Rekonq
    /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs)\/([\w.-]+)/i
                                                                      // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS
  ], ['name', 'version'],
  [
    /(trident).+rv[:\s]([\w.]+).+like\sgecko/i                         // IE11
  ], [['name', 'IE'], 'version'],
  [
    /(edge)\/((\d+)?[\w.]+)/i                                          // Microsoft Edge
  ], ['name', 'version'],
  [
    /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w.]+)/i,     // Chrome/OmniWeb/Arora/Tizen/Nokia
    /(qqbrowser)[/\s]?([\w.]+)/i                                        // QQBrowser
  ], ['name', 'version'],
  [
    /(uc\s?browser)[/\s]?([\w.]+)/i,
    /ucweb.+(ucbrowser)[/\s]?([\w.]+)/i,
    /juc.+(ucweb)[/\s]?([\w.]+)/i                                     // UCBrowser
  ], [['name', 'UCBrowser'], 'version'],
  [
    /(dolfin)\/([\w.]+)/i                                              // Dolphin
  ], [['name', 'Dolphin'], 'version'],
  [
    /;fbav\/([\w.]+);/i                                                // Facebook App for iOS
  ], ['version', ['name', 'Facebook']],
  [
    /(yabrowser)\/([\w.]+)/i                                           // Yandex
  ], [['name', 'Yandex'], 'version'],
  [
    /(comodo_dragon)\/([\w.]+)/i                                       // Comodo Dragon
  ], [['name', /_/g, ' '], 'version'],
  [
    /(micromessenger)\/([\w.]+)/i                                      // WeChat
  ], [['name', 'WeChat'], 'version'],
  [
    /xiaomi\/miuibrowser\/([\w.]+)/i                                   // MIUI Browser
  ], ['version', ['name', 'MIUI Browser']],
  [
    /\swv\).+(chrome)\/([\w.]+)/i                                      // Chrome WebView
  ], [['name', /(.+)/, '$1 WebView'], 'version'],
  [
    /android.+samsungbrowser\/([\w.]+)/i,
    /android.+version\/([\w.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
  ], ['version', ['name', 'Android Browser']],
  [
    /((?:android.+)crmo|crios)\/([\w.]+)/i                             // Chrome for Android/iOS
  ], [['name', 'Chrome'], 'version'],
  [
    /fxios\/([\w.-]+)/i                                                // Firefox for iOS
  ], ['version', ['name', 'Firefox']],
  [
    /version\/([\w.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
  ], ['version', ['name', 'Mobile Safari']],
  [
    /version\/([\w.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
  ], ['version', 'name'],
  [
    /webkit.+?(mobile\s?safari|safari)(\/[\w.]+)/i                     // Safari < 3.0
  ], ['name', ['version', '3.0']],
  [
    /(konqueror)\/([\w.]+)/i,                                          // Konqueror
    /(webkit|khtml)\/([\w.]+)/i
  ], ['name', 'version'],
  [
    // Gecko based
    /(navigator|netscape)\/([\w.-]+)/i                                 // Netscape
  ], [['name', 'Netscape'], 'version'],
  [
    /(swiftfox)/i,                                                      // Swiftfox
    /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[/\s]?([\w.+]+)/i, // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
    /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w.-]+)/i, // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
    /(mozilla)\/([\w.]+).+rv:.+gecko\/\d+/i,                          // Mozilla
    // Other
    /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[/\s]?([\w.]+)/i, // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
    /(links)\s\(([\w.]+)/i,                                            // Links
    /(gobrowser)\/?([\w.]+)*/i,                                        // GoBrowser
    /(ice\s?browser)\/v?([\w._]+)/i,                                   // ICE Browser
    /(mosaic)[/\s]([\w.]+)/i                                          // Mosaic
  ], ['name', 'version']
]

let browser = (() => {
  let found = false
  let result = {name: 'unknow', version: 0} // 默认值
  let i = -2
  let regxs
  let prop
  while ((i += 2, (prop = REGX_MAP[i + 1]) && (regxs = REGX_MAP[i])) && !found) {
    regxs.some((regx) => {
      let match = regx.exec(ua)
      if (match) {
        found = true
        prop.forEach((key, i) => {
          if (isArray(key)) {
            result[key[0]] = key[1]
          } else {
            result[key] = match[i + 1]
          }
        })
        return true
      }
    })
  }
  return result
})()
export default browser
