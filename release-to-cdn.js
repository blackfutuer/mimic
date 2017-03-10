/**
 * 上传文件到 upyun
 */
'use strict'
let path = require('path')
let request = require('request')
let crypto = require('crypto')
let mime = require('mime')
let fs = require('fs')
let glob = require('glob')

console.log('start release to cdn...')

let conf = {
  bucket: 'mimic',
  expiration: 30 * 60 * 60,
  token: 'izKZlKPzwfjKBF02mYnWemXILvA='
}

let isDev = process.argv[2] === 'dev'
let endpoint = isDev ? 'v0.api.upyun.com' : 'd1.sinaimg.cn'

function md5sum (data) {
  var md5 = crypto.createHash( 'md5' );
  md5.update(data, 'utf8');
  return md5.digest('hex');
}

function makeSign (uri, type) {
  if (uri.indexOf('?') !== -1) {
    uri = uri.split('?')[0]
  }

  let api_args = {
    'bucket': conf.bucket,
    'save-key': uri,
    'expiration' : new Date() / 1000 + conf.expiration,
    'content-type': type
  }

  var policy = new Buffer(JSON.stringify(api_args), 'utf8').toString('base64')
  var signature = md5sum( policy + "&" + conf.token)
  return {
    policy: policy,
    signature: signature
  }
}

function upload (remotePath, localFile, type, callback) {
  var sign = makeSign(remotePath, type)

  var url = "http://" + endpoint + '/' + conf.bucket

  var req = request.post(url, function (err, res, body) {
    if (err) {
      callback(err)
    } else {
      callback(null, res, JSON.parse(body))
    }
  })
  var form = req.form();
  form.append('policy', sign.policy);
  form.append('signature', sign.signature)
  form.append('file', fs.createReadStream(localFile))
}


let uploadPath = 'build'
glob(
  '**/*.js',
  {
    cwd: path.resolve(process.cwd(), uploadPath)
  },
  (err, files) => {
    let result = []
    files.forEach(file => {
      let fullPath = path.resolve(uploadPath, file)
      result.push(new Promise((resolve, reject) => {
        upload(file, fullPath, mime.lookup(fullPath), (err, res, body) => {
          resolve({
            status: err ? 1 : 0,
            body: err ? err : body
          })
        })
      }))
    })
    Promise.all(result)
      .then(ress => {
        let suc = 0
        let err = 0
        ress.forEach(res => {
          if (res.status) {
            err++
          } else {
            suc++
          }
        })
        console.log(`success: ${suc}, error: ${err}`, ress)
      })
  }
)
