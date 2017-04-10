'use strict'

const Readable = require('stream').Readable

// We don't want to spend cycles generating random bytes, so
// we pre-generate enough of them and then just slice (no copy)
// the buffers as needed
const randomBytes = Buffer.alloc(64 * 1024)

for (var i = 0; i < randomBytes.length; i++) {
  randomBytes[i] = Math.floor(Math.random() * 256)
}

module.exports = function randomByteStream (maxSize) {
  let totalSize = 0

  return Readable({ read: read })

  function read (targetSize) {
    this.push(randomBytes.slice(0, targetSize))
    totalSize += targetSize
    if (totalSize >= maxSize) {
      this.push(null)
    }
  }
}
