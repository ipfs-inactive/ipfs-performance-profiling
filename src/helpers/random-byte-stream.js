'use strict'

const Readable = require('stream').Readable

const SIXTY_FOUR_KB = 64 * 1024

// We don't want to spend cycles generating random bytes, so
// we pre-generate enough of them and then just slice (no copy)
// the buffers as needed
const randomBytes = Buffer.alloc(64 * 1024)

for(var i = 0 ; i < randomBytes.length; i ++) {
  randomBytes[i] = Math.floor(Math.random() * 256)
}

const defaultOptions = {
  seed: Math.floor(Math.random() * 256)
}

module.exports = function randomByteStream (maxSize, _options) {
  const options = Object.assign({}, { read: read }, defaultOptions)
  let seed = options.seed
  let totalSize = 0

  return Readable(options)

  function read (targetSize) {
    this.push(randomBytes.slice(0, targetSize))
    totalSize += targetSize
    if (totalSize >= maxSize) {
      this.push(null)
    }
  }
}

function random (seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
