'use strict'

require('colors')
const join = require('path').join
const exec = require('child_process').exec
const open = require('opn')
const mkdirp = require('mkdirp')
const fs = require('fs')
const argv = require('yargs').argv
const mapSeries = require('async/mapSeries')
const waterfall = require('async/waterfall')

const aggregate = require('./aggregate')

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
mkdirp.sync(outDir)
const out = join(outDir, 'report.html')
const resultsJSONPath = join(outDir, 'results.json')

mapSeries(
  suites,
  (suite, callback) => {
    waterfall([
      (callback) => {
        // run suite
        const command = 'node ' + __dirname + ' ' + suite
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
        process.stderr.write(('profiling ' + suite + '\n').yellow)
        const command = ['node', join(__dirname, 'profile'), suite, '--out', join(outDir, suite)].join(' ')
        const child = exec(command, (err, stdout) => {
          if (err) {
            callback(err)
          } else {
            process.stderr.write('done\n\n'.green)
            result[0].profile = join(suite, stdout.trim())
            callback(null, result)
          }
        })
        child.stderr.pipe(process.stderr, { end: false })
      }
      ],
      callback)
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
