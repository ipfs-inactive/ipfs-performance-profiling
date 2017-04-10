'use strict'

const concat = require('concat-stream')
const handlebars = require('handlebars')
const fs = require('fs')
const join = require('path').join
const template = handlebars.compile(
  fs.readFileSync(join(__dirname, 'report-templates', 'results.html'), 'utf8'))

process.stdin.pipe(concat(gotResult))

function gotResult (str) {
  const result = JSON.parse(str)
  /* eslint no-console: ["error", {allow: ["error"]}] */
  console.error(str.toString())
  outputReport(result)
}

function outputReport (result) {
  const html = template(result)
  process.stdout.write(html)
}
