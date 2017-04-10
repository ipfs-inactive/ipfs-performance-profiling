# ipfs-performance-profiling

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)


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
$ npm run benchmarks -- files-add-1MB-file --envs=js-http
```

### JSON output

You can output a JSON report using the `--json` options:

```bash
$ npm run benchmarks -- files-add-1MB-file --json
```

## Reports

You run and produce an HTML report using:

```bash
$ npm run benchmarks:report
```

### Report with profiling data

You run and produce an HTML report containing links to profiling data using:

```bash
$ npm run benchmarks:report:profile -- [<suite>] --envs=[env1,env2]
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

Add it under its own dir under `src/suites`. Also, don't forget to add an entry to `src/suites/index.js` so that it can be found.

### Logging

The suite runner uses the `stdout` channel for the benchmark results. If you want to log to the console, use `console.error` instead.


## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/ipfs-performance-profiling/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
