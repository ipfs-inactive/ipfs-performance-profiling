'use strict'

const Factory = require('./factory')

module.exports = function prepareGo (callback) {
  const factory = new Factory()

  factory.spawnNode(callback)

  return function shutdown (callback) {
    factory.dismantle(callback)
  }
}
