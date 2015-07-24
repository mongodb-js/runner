# mongodb-runner

[![Build Status](https://travis-ci.org/mongodb-js/runner.svg?branch=master)](https://travis-ci.org/mongodb-js/runner)

Starts and sets up deployment recipes for testing against by piping to
`mongo` shell and reusing all of the internal functions.


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

## Example

```javascript
var mongodb = require('mongodb-runner');

// Start a standalone, standalone with auth, replica set, and cluster
// process.env.DEBUG = 'mongodb*'; // uncomment me to get stdout from shell commands
mongodb(function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('MongoDB deployments for testing ready!');
  // do tests and stuff
  // all processes started by runner will be SIGTERM'd when this process exits.
});

// start just a standalone
mongodb({port: 27018, dbpath: '/ebs/data/'+process.env.JOB_ID+'_standalone'}, function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('Standalone ready on localhost:27018!');
});

// just a replicaset
mongodb('replicaset', {name: 'replicom', instances: 3, startPort: 6000}, function(err, res){
  if(err) return console.error('Uhoh...', err);
  console.log('replicaset ready!', res.uri);
});
```

### Shell

```
npm install -g mongodb-runner
DEBUG=* mongodb-runner
```


## Under the hood

Just uses the kernel's testing helpers:


```javascript
shell(
  'var opts = {shards: '+opts.shards+', chunkSize: 1, rs: {oplogSize: 10}, name: \''+opts.db+'\'};',
  'var st = new ShardingTest(opts);',
  'st.s.getDB(\''+opts.db+'\').adminCommand({enableSharding: \''+opts.db+'\'});',
  'st.s.getDB(\''+opts.db+'\').adminCommand({shardCollection: \''+opts.ns+'\', key: {_id: 1 }});',
fn);
```

```javascript
shell('var opts = {name: \''+opts.name+'\', nodes: '+opts.instances+', useHostName: false, startPort: '+opts.startPort+'};',
  'var rs = new ReplSetTest(opts);',
  'rs.startSet();', 'rs.initiate();',
  fn);
```

## License

MIT
