'use strict'
/* eslint no-console: ["error", {allow: ["error"]}] */

require('colors')
const mapSeries = require('async/mapSeries')
const Benchmark = require('benchmark-async')
const os = require('os')

const suites = require('./suites')
const prepare = require('./prepare')

const ENVIRONMENTS = [
  'go',
  'js-core',
  'js-http'
]

module.exports = run

module.exports.allEnvironments = ENVIRONMENTS

function run (_suites, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const envs = options.envs || ENVIRONMENTS
  const s = _suites || suites
  mapSeries(s, runOne, (err, result) => {
    if (!err) {
      process.stderr.write('all finished\n'.green)
    }
    callback(err, { suites: result })
  })

  function runOne (_suite, callback) {
    let suite = _suite
    if (typeof suite === 'string') {
      suite = suites.find(s => s.name === suite)
      if (!suite) {
        return callback(new Error('no suite named ' + _suite))
      }
    }
    process.stderr.write((suite.name + ' started\n').yellow)

    const benchmarks = []
    let tests = suite.tests || suite.test
    if (!Array.isArray(tests)) {
      tests = [tests]
    }

    tests.forEach((test, index) => {
      envs.forEach((env) => {
        let teardownFn
        let ipfs
        const name = [test.name || suite.name, tests.length > 1 && (index + 1), env].filter(Boolean).join('-')
        const options = {
          defer: true,
          setup: setup,
          teardown: teardown
        }
        const benchmark = new Benchmark(name, wrapTest(test), options)
        benchmark.env = env
        benchmark.unwrappedFn = test
        benchmarks.push(benchmark)

        function setup (deferred) {
          if (teardownFn) {
            deferred.suResolve()
            return // early
          }
          ipfs = null
          teardownFn = prepare(env, (err, _ipfs) => {
            if (err) {
              throw err
            }
            ipfs = _ipfs
            deferred.suResolve()
          })
        }

        function teardown (deferred) {
          if (!teardownFn) {
            deferred.tdResolve()
            return // early
          }
          const tdfn = teardownFn
          teardownFn = null
          tdfn((err) => {
            if (err) {
              throw err
            }
            deferred.tdResolve()
          })
        }

        function wrapTest (test) {
          return function (deferred) {
            if (!ipfs) {
              throw new Error('No ipfs')
            }
            test(ipfs, (err) => {
              if (err) {
                throw err
              }
              deferred.resolve()
            })
          }
        }
      })
    })

    mapSeries(
      benchmarks,
      (benchmark, cb) => {
        console.error('RUNNING', benchmark.name)
        benchmark.on('complete', () => {
          cb(null, result(benchmark))
        })

        benchmark.run({ async: true })
      },
      (err, results) => {
        if (err) {
          throw err
        }

        console.error('benchmarks finished\n')
        callback(null, {
          suite: suite.name,
          results: results
        })
      }
    )
  }
}

function result (benchmark) {
  return {
    name: benchmark.name,
    env: benchmark.env,
    code: benchmark.unwrappedFn.toString(),
    platform: Benchmark.platform,
    cpus: os.cpus(),
    loadavg: os.loadavg(),
    count: benchmark.count,
    hz: benchmark.hz,
    now: Date.now(),
    stats: {
      moe: benchmark.stats.moe,
      rme: benchmark.stats.rme,
      sem: benchmark.stats.sem,
      deviation: benchmark.stats.deviation,
      mean: benchmark.stats.mean,
      variance: benchmark.stats.variance
    }
  }
}
