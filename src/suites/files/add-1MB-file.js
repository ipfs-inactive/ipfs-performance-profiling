'use strict'

const randomByteStream = require('../../helpers/random-byte-stream')

module.exports = function (ipfs, callback) {
  ipfs.files.add([{
    path: '1MB.txt',
    content: randomByteStream(1024 * 1024)
  }], callback)
}
