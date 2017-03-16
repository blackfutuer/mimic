// 异步加载广告代码
var mimic = mimic || {
  cmd: []
  // ,backRefresh: true // 是否需要保持回退刷新，可以是个数组，如果是数组的话只刷新这个数组表示的slot
  // ,enableLogger: true // 是否开始log
  // ,enablePerf: true // 是否监测性能数据
  //,component: '//10.237.66.67:2222/dist/mimic-components.js' // 组件依赖地址
};
(function (d, s, id) {
  var s, n = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  s = d.createElement(s);
  s.id = id;
  s.setAttribute('charset', 'utf-8');
  s.src = '//d' + Math.floor(0 + Math.random() * (9 - 0 + 1)) + '.sinaimg.cn/litong/mimic/mimic.js';
  // s.src = '../build/mimic.js';
  n.parentNode.insertBefore(s, n);
  // 5s后检查下mimic的cmd，如果还是数组，那么说明mimic加载超时
  // 或者没有正常处理
  setTimeout(function () {
    if (Object.prototype.toString.call(mimic.cmd) === '[object Array]') {
      var img = new Image()
      img.src = '//csi.sina.cn/csi?mimic_lib_timeout&ts=' + (+new Date)
    }
  }, 5 * 1000)
})(document, 'script', 'mimic')

// sinaad.insert, 从channelPushs配置转换到插入位置，并启动广告渲染
var sinaad = (function () {
  var uuid = 0
  function genSlotName () {
    return 'slot-' + (+new Date()).toString(36) + (uuid++)
  }
  function insert() {
    var channelPushs = window.channelPushs || []
    if (channelPushs.length <= 0) {
      return
    }
    mimic.cmd.push(function () {
      var slotNames = []
      var feeds = document.querySelectorAll('.f_card')
      for (var i = 0, len = channelPushs.length; i < len; i++) {
        var ad = channelPushs[i]
        var pdps
        var insertPos = ad.cardPos - i - 1
        if (ad.inserted) {
          continue
        }
        if (
          feeds[insertPos]
          && ad.domHTML
          && (pdps = ad.domHTML.match(/.*data\-id="([^"]+)".*/)[1])
        ) {
          ad.inserted = true
          var el = document.createElement('div')
          var sn = genSlotName()
          el.id = sn
          slotNames.push(sn)
          var node = feeds[insertPos].parentNode
          node.parentNode.insertBefore(el, node)
          var slot = mimic.defineSlot(pdps, [320, 90], sn)
          if (slot) {
            slot.addService(mimic.sns())
          } else {
            console.log('no slot: ', pdps, sn)
          }
        } else {
          break
        }
      }
      mimic.sns().enableSingleRequest()
      mimic.enableServices()
      slotNames.forEach(function (sn) {
        mimic.display(sn)
      })
    })
  }
  return {
    insert: insert
  }
})()

// 定义一个自定义事件，用来在feed改变的时候触发
;(function () {
  function onfeedchange (cb) {
    // 默认一上来就有静态的feed填充，所以直接写入001
    var ready = 1 // 按位填空，111 = 7表示都完成，000 = 0表示都没完成， （guess, tianyi, more）
    function _flush() {
      ready >= 7 && cb() // ready === 111
    }
    if (!window.$) {
      ready |= 7 // 没有$, 意味着没有事件环境，这时候认为所有都ready, 111
      _flush()
      return
    }
    // 按位运算，防止重复置位，因为不知道手浪业务是否判断了guessLikeConfig和tianyiapi
    // 来决定是否直接触发guess和tianyi事件
    !window.guessLikeconfig && (ready |= 4)  // 100
    !window.tianyiapi && (ready |= 2)        // 010
    _flush()

    // 响应业务上返回的事件
    $(window).on('asynModuleEnd', function (e, type) {
      switch (type) {
        case 'guess': ready |= 4; _flush(); break   // 100
        case 'tianyi': ready |= 2; _flush(); break  // 010
        case 'feedMore': ready |= 1; _flush(); break // 001
        default: break
      }
    })
  }
  onfeedchange(sinaad.insert)
})()
