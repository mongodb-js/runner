# mongodb-runner [![][npm_img]][npm_url] [![][travis_img]][travis_url]

> Easily install and run MongoDB to test your code against it.

## Examples

### Mocha

Mocha before/after hooks make writing tests for code that depends on MongoDB insanely simple:

```javascript
describe('my app', function(){
  before(require('mongodb-runner/mocha/before'));
  after(require('mongodb-runner/mocha/after'));
  it('should connect', function(done){
    require('mongodb').connect('mongodb://localhost:27017/', done);
  });
});
```

Global hooks are also supported.  Add the following to a new file called `test/mongodb.js`:

```javascript
before(require('mongodb-runner/mocha/before'));
after(require('mongodb-runner/mocha/after'));
```

And then just require it:

```
mocha --require test/mongodb.js test/*.test.js
```

### TravisCI

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
  - MONGODB_VERSION=unstable MONGODB_TOPOLOGY=standalone
  - MONGODB_VERSION=2.6.x MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=3.0.x MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=unstable MONGODB_TOPOLOGY=replicaset
  - MONGODB_VERSION=2.6.x MONGODB_TOPOLOGY=cluster
  - MONGODB_VERSION=3.0.x MONGODB_TOPOLOGY=cluster
  - MONGODB_VERSION=unstable MONGODB_TOPOLOGY=cluster
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

Environment Variables:
  MONGODB_VERSION      What version of MongoDB should be installed and available [Default: `stable`]
  MONGODB_TOPOLOGY     See `--topology`
  MONGODB_PORT         See `--port`
  MONGODB_TOPOLOGY     See `topology`
  MONGODB_ARBITERS     See `arbiters`
  MONGODB_SECONDARIES  See `secondaries`
  MONGODB_PASSIVES     See `passives`
  MONGODB_SHARDS       See `--shards`
  MONGODB_ROUTERS      See `--routers`
  MONGODB_CONFIGS      See `--configs`
  MONGODB_SHARDS_PORT  See `--shardPort`
  MONGODB_CONFIGS_PORT See `--configPort`
  MONGODB_ARBITERS     See `--arbiters`
  MONGODB_SECONDARIES  See `--secondaries`
  MONGODB_PASSIVES     See `--passives`
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/runner.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/runner
[npm_img]: https://img.shields.io/npm/v/mongodb-runner.svg
[npm_url]: https://www.npmjs.org/package/mongodb-runner
