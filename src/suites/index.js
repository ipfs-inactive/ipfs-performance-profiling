'use strict'

module.exports = [
  { name: 'files-add-small-file', tests: require('./files/add-small-file') },
  { name: 'files-add-1MB-file', tests: require('./files/add-1MB-file') },
  { name: 'files-add-100MB-file', tests: require('./files/add-100MB-file') }
]
