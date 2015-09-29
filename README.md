# mongodb-runner [![][npm_img]][npm_url] [![][travis_img]][travis_url] [![][appveyor_img]][appveyor_url] [![][gitter_img]][gitter_url]

> Easily install and run MongoDB to test your code against it.

## Example

Modify your `package.json` to start and stop MongoDB before and after your tests
automatically when you run `npm test`:

```json
{
  "scripts": {
    "pretest": "mongodb-runner start",
    "test": "mocha",
    "posttest": "mongodb-runner stop"
  }
}
```

Update your `.travis.yml` to run your tests against the full version + topology matrix:

```yaml
language: node_js
cache:
  directories:
    - node_modules
env:
  - MONGODB_VERSION=2.6.x MONGODB_TOPOLOGY=standalone
  - MONGODB_VERSION=3.0.x MONGODB_TOPOLOGY=standalone
  - MONGODB_VERSION=3.1.x MONGODB_TOPOLOGY=standalone
  - MONGODB_VERSION=2.6.x MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=3.0.x MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=3.1.x MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=2.6.x MONGODB_TOPOLOGY=cluster
  - MONGODB_VERSION=3.0.x MONGODB_TOPOLOGY=cluster
  - MONGODB_VERSION=3.1.x MONGODB_TOPOLOGY=cluster
```

And :tada: Now you're fully covered for all of those all of those edge cases the full
version + topology matrix can present!


## Usage

```
Usage: mongodb-runner <start|stop> [options]

Start/stop mongodb for testing.

Options:
  --topology=<topology>         One of standalone, replicaset, or cluster [Default: `standalone`].
  --pidpath=<pidpath>           Where to put pid files [Default: `~/mongodb/pids`].
  --bin=<path>                  Path to mongod|mongos binary [Default: `which mongod|mongos`].

Options depending on `--topology`:
  --topology=standalone
    --name=<name>                 The replSet name [Default: `my-standalone`].
    --port=<port>                 Port to start mongod on [Default: `27017`].
    --dbpath=<dbpath>             Where to put the data [Default: `~/.mongodb/data/#{name}`]
    --logpath=<logpath>           [Default: `~/.mongodb/#{name}.log`]

  --topology=replicaset
    --name=<name>                 The replSet name [Default: `my-replicaset`].
    --port=<port>                 The starting port to use for mongod instances [Default: `31000`].
    --dbpath=<dbpath>             [Default: `~/.mongodb/data/#{name}-#{instance_id}`]
    --logpath=<logpath>           [Default: `~/.mongodb/#{name}.log/#{instance_id}.log`]
    --arbiters=<n>                How many arbiters to start [Default: `0`].
    --passives=<n>                How many passive instances to start [Default: `1`].
    --secondaries=<n>             How many secondary instances to start [Default: `2`]. Maps to `secondaries` option.

  --topology=cluster
    --shards=<n>                  Number of shards in the cluster [Default: `2`].
    --routers=<n>                 Number of router instances [Default: `2`].
    --configs=<n>                 Number of config servers [Default: `1`].
    --routerPort=<port>           Port number to start incrementing from when starting routers [Default `50000`].
    --port=<port>                 Port number to start incrementing from when starting shard members [Default `31000`].
    --configPort=<port>           Port number to start incrementing from when starting shard members [Default `35000`].

```

## License

Apache 2.0

[travis_img]: https://secure.travis-ci.org/mongodb-js/runner.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/runner
[npm_img]: https://img.shields.io/npm/v/mongodb-runner.svg
[npm_url]: https://www.npmjs.org/package/mongodb-runner
[appveyor_img]: https://ci.appveyor.com/api/projects/status/voa841j5ke8jtpfh?svg=true
[appveyor_url]: https://ci.appveyor.com/project/imlucas/mongodb-runner
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[gitter_url]: https://gitter.im/mongodb-js/mongodb-js
