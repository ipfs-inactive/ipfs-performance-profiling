# ipfs-performance-profiling

Benchmarking tests for js-ipfs, using go-ipfs as a baseline.

## Install

```bash
$ git clone https://github.com/ipfs/ipfs-performance-profiling.git
$ cd ipfs-performance-profiling
$ npm install
```

## Run

Run all benchmarks on all environments:

```bash
$ npm run benchmarks
```

Run all benchmarks on the go and js-core environments:

```bash
$ npm run benchmarks -- --envs=go,js-core
```

Available environments are:

* `go`
* `js-core`
* `js-http`

Run named benchmark on the js-http environment:

```
$ npm run benchmarks import-files -- --envs=js-http
```

### JSON output

You can output a JSON report using the `--json` options:

```bash
$ npm run benchmarks import-files -- --json
```

## Reports

You run and produce HTML reports using:

```bash
$ npm run benchmarks:report
```

## Creating a benchmark suite

A benchmark suite is simply a function that gets two arguments: an IPFS client object and a callback:

```js
module.exports = function (ipfs, callback) {
  ipfs.files.add([{
    path: 'a.txt',
    content: new Buffer('a')
  }], callback)
}
```

Add them to the `src/suites` dir. Also, don't forget to add an entry to `src/suites/index.js` so that it can be found.

### Logging

The suite runner uses the `stdout` channel for the benchmark results. If you want to log to the console, use `console.error` instead.

