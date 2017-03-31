'use strict'

const run = require('./run')

const argv = require('yargs')
  .usage('$0 [--json] [--envs=<comma-separated envs>] ')
  .help()
  .argv

console.log(argv)

let suites = argv._

if (!suites.length) {
  suites = undefined
}

const options = {
  envs: argv.envs && argv.envs.split(',')
}

run(suites, options, (err, results) => {
  if (err) {
    throw err
  }

  if (argv.json) {
    console.log(JSON.stringify(results, null, '  '))
  } else {
    console.log('\nResults:\n'.yellow)
    results.suites.forEach((s) => {
      console.log(s.suite + ':')
      s.results.forEach((result) => {
        console.log('  ' + result.env + ':')
        const stats = {
          mean: result.stats.mean,
          variance: result.stats.variance,
          deviation: result.stats.deviation,
          moe: result.stats.moe,
          rme: result.stats.rme,
          sem: result.stats.sem
        }
        console.log('    ' + Object.keys(stats).map((statKey) => statKey + ': ' + stats[statKey]).join(', '))
      })
    })
  }
})
