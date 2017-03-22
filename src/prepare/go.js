'use strict'

const ipfsd = require('ipfsd-ctl')
const series = require('async/series')

module.exports = function prepareGo (callback) {
  let node

  ipfsd.disposable((err, _node) => {
    if (err) {
      callback(err)
      return // early
    }

    node = _node

    node.startDaemon((err, ipfs) => {
      if (err) {
        callback(err)
        return // early
      }

      callback(null, ipfs)
    })
  })

  return function shutdown (callback) {
    if (!node) {
      callback()
      return // early
    }

    series([
      node.stopDaemon.bind(node),
      node.shutdown.bind(node)
    ], callback)
  }
}
