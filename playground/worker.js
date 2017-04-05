onmessage =function (evt){
  var d = evt.data
  fetch('http://sax.sina.cn/native/impress?adunit_id=PDPS000000056294%2CPDPS000000056295%2CPDPS000000056296%2CPDPS000000056349%2CPDPS000000056350%2CPDPS000000056351%2CPDPS000000056352%2CPDPS000000056353&rotate_count=194&page_url=http%3A%2F%2Fblog.sina.cn%2F&callback=mimic_cb_j0xk23es&timestamp=1490948191684')
    .then((data) => {
      postMessage('收到' + data)
    })
}