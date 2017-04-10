'use strict'

module.exports = function (ipfs, callback) {
  ipfs.files.add([{
    path: 'a.txt',
    content: new Buffer('a')
  }], callback)
}
