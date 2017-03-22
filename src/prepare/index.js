'use strict'

const preparers = {
  'go': require('./go'),
  // 'cli': require('./cli'),
  'js-core': require('./js-core')
}

module.exports = function prepare (test, env) {
  return function (d) {
    const preparer = preparers[env]
    if (!preparer) {
      throw new Error('Unknown environment ' + env)
    }

    console.error('preparing %s environment...', env)
    const shutdown = preparer((err, ipfs) => {
      if (err) {
        throw err
      }

      console.error('prepared.')

      test(ipfs, (err) => {
        if (err) {
          throw err
        }
        shutdown((_err) => {
          if (_err) {
            throw _err
          }
          d.resolve()
        })
      })
    })
  }
}
