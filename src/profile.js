'use strict'

const spawn = require('child_process').spawn
const split = require('split')
const url = require('url')
const path = require('path')
const mapSeries = require('async/mapSeries')

module.exports = profile

function profile (outDir, suites, envs, callback) {
  mapSeries(envs, (env, callback) => {
    profileOneEnv(outDir, suites, env, (err, path) => {
      if (err) {
        callback(err)
        return // early
      }

      callback(null, {
        env: env,
        path: path
      })
    })
  }, callback)
}

function profileOneEnv (baseOutDir, suites, env, callback) {
  const outDir = path.join(baseOutDir, env)
  const args = ['--output-dir', outDir].concat([process.argv[0], __dirname].concat(suites).concat('--envs=' + env))

  console.log('SPAWNING 0x', args.join(' '))
  const child = spawn('0x', args, {})
  let lastLine = ''
  let error
  let errorOut = ''
  let ended = false

  process.once('SIGINT', () => {
    if (!ended) {
      console.error('INT')
      child.kill('SIGINT')
    }
  })

  child.stdout.pipe(process.stdout, { end : false })

  child.stderr.pipe(split())
    .on('data', (line) => {
      if (line) {
        lastLine = line
        errorOut += line + '\n'
      }
    })
    .once('end', () => {
      console.log('ENDED')
      ended = true
      if (!error) {
        const matched = lastLine.match(/file:\/\/.*\/flamegraph.html/)
        if (matched) {
          const resultPath = url.parse(matched[0].replace('file://', 'file:///')).pathname
          callback(null, path.relative(baseOutDir, resultPath))
        } else {
          callback(new Error('0x unexpected output:\n' + errorOut))
        }
      }
    })
    .once('error', (err) => {
      error = err
      callback(err)
    })
}
