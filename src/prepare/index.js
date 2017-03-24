'use strict'

const preparers = {
  'go': require('./go'),
  'js-core': require('./js-core'),
  'js-http': require('./js-http')
}

module.exports = function prepare (env, callback) {
  const preparer = preparers[env]
  if (!preparer) {
    callback(new Error('Unknown environment ' + env))
  }

  console.error('preparing %s environment...', env)
  return preparer(callback)
}
