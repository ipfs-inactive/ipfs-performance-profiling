'use strict'

require('colors')
const join = require('path').join
const exec = require('child_process').exec
const open = require('opn')
const mkdirp = require('mkdirp')
const fs = require('fs')
const argv = require('yargs').argv
const mapSeries = require('async/mapSeries')
const eachSeries = require('async/eachSeries')
const waterfall = require('async/waterfall')

const aggregate = require('./aggregate')
const profile = require('./profile')
const envs = require('./run').allEnvironments

const PATTERNS_TO_OBLITERATE = [
  /Swarm listening on .*\n/g,
  /Starting at .*\n/g,
  /API is listening on: .*\n/g,
  /Gateway \(readonly\) is listening on: .*\n/g,
  /Stopping server/g
]

let suites = argv._
if (!suites.length) {
  suites = require('./suites').map(s => s.name)
}

const prefix = (new Date()).toISOString() + '-report'
const outDir = join(__dirname, '..', 'reports', 'out', prefix)
const out = join(outDir, 'report.html')
const resultsJSONPath = join(outDir, 'results.json')

mkdirp.sync(outDir)

mapSeries(
  suites,
  (suite, callback) => {
    waterfall([
      (callback) => {
        // run suite
        const command = ['node', __dirname, suite, ' --json'].join(' ')
        const child = exec(command, (err, stdout) => {
          console.log(stdout)
          if (err) {
            callback(err)
          } else {
            const out = cleanOutput(stdout)
            try {
              callback(null, JSON.parse(out))
            } catch (err) {
              console.error('Error parsing output: %s' + out)
              throw err
            }
          }
        })
        child.stderr.pipe(process.stderr, { end: false })
      },
      (result, callback) => {
        // profile suite (if --profile option was given)
        if (!argv.profile) {
          callback(null, result)
          return
        }

        eachSeries(envs, (env, callback) => {
          if (env === 'go') {
            callback()
            return // early
          }

          process.stderr.write(('profiling ' + suite + ', env: ' + env + '\n').yellow)
          mkdirp.sync(join(outDir, suite, env))

          profile(join(outDir, suite), [suite], [env], (err, profileResults) => {
            if (err) {
              callback(err)
              return // early
            }
            process.stderr.write('done\n\n'.green)

            // find suite

            profileResults.forEach((profileResult) => {
              const envResults = findEnvResultsInResult(result, suite, profileResult.env)
              envResults.profile = profileResult.path
            })

            callback(null, result)
          })
        }, (err) => {
          callback(err, result)
        })
      }
    ], callback)
  },
  (err, _results) => {
    if (err) {
      throw err
    }

    const results = _results.reduce((acc, a) => acc.concat(a), [])

    waterfall([
      saveResults.bind(null, results),
      aggregate,
      merge,
      generateReport
      ],
      (err) => {
        if (err) {
          throw err
        }
        process.stderr.write('finished.\n'.green)
        process.stderr.write('saved results to ' + resultsJSONPath + '\n')
        process.stderr.write('opening ' + out + '\n')
        open(out, { wait: false })
      })

    function saveResults (results, callback) {
      const out = resultsJSONPath
      fs.writeFile(out, JSON.stringify(results, null, '  '), callback)
    }

    function merge (aggregationResults, callback) {
      console.log('aggregation results', aggregationResults)
      aggregationResults.forEach((aggResult) => {
        const suite = findSuiteInResults(results, aggResult.suite)
        if (!suite) {
          console.error('Could not find suite named ' + aggResult.suite)
        } else {
          suite.history = aggResult.benchmarks
        }
      })
      callback(null, results)
    }
  }
)

function findSuiteInResults (results, suiteName) {
  let foundSuite
  results.forEach((result) => {
    result.suites.forEach((suite) => {
      if (suite.suite === suiteName) {
        foundSuite = suite
      }
    })
  })

  return foundSuite
}

function generateReport (results, callback) {
  process.stderr.write('generating report...\n'.yellow)
  const command = 'node src/generate-report > ' + out

  const child = exec(command, callback)
  child.stderr.pipe(process.stderr, { end: false })
  child.stdin.end(JSON.stringify(results))
}

function cleanOutput (out) {
  return PATTERNS_TO_OBLITERATE.reduce((out, p) => out.replace(p, ''), out)
}

function findEnvResultsInResult (result, suite, env) {
  let found
  result.suites.forEach((s) => {
    if (s.suite === suite) {
      s.results.forEach((result) => {
        if (result.env === env) {
          found = result
        }
      })
    }
  })

  return found
}