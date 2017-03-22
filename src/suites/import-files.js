'use strict'

const timers = require('timers')

module.exports = function (ipfs, callback) {
  timers.setTimeout(() => callback(), 5)
}
