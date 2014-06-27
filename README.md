# mongodb-runner

[![build status](https://secure.travis-ci.org/imlucas/mongodb-runner.png)](http://travis-ci.org/imlucas/mongodb-runner)

Starts all of the deployment types for testing by piping to `mongo` shell.

## Example

```javascript
var runner = require('mongodb-runner');

// Start a standalone, replica set, and cluster
// process.env.DEBUG = 'mongodb*'; // uncomment me to get stdout from shell commands
runner.listen(function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('MongoDB deployments for testing ready!');
  // do tests and stuff
  // all processes started by runner will be SIGTERM'd when this process exits.
});

// start just a standalone
runner({port: 27018, dbpath: '/ebs/data/'+process.env.JOB_ID+'_standalone'}, function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('Standalone ready on localhost:27018!');
});

// just a replicaset
runner.replicaset({name: 'replicom', instances: 3, startPort: 6000}, function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('replicaset ready!');
  console.log('primary: localhost:6000');
  console.log('secondaries: localhost:6001, localhost:6002');
});

// just a cluster
runner.replicaset({db: 'clusterco', collection: 'users', shards: 2}, function(err){
  if(err) return console.error('Uhoh...', err);
  console.log('clusterco ready to be tested!');
});
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

## Todo

- [ ] Integrate @imlucas/mongodb-bridge fully as a option `bridge: true`
- [ ] Use lone to prebake binaries and upload to releases
- [ ] Make mongodb-bridge capable of reconfiguring oplog.rs automatically [per kristina's example](http://www.kchodorow.com/blog/2011/04/20/simulating-network-paritions-with-mongobridge/)
- [ ] `mongodb-runner killall` for cross platform kill mongod|mongos
- [ ] `mongodb-runner startall` should fork when everything started
- [ ] mongodb-runner keeps pid files in `{cwd}/.mongodb/pids` for safe
      startall and killall
- [ ] ALL ci tasks can then just be:
    ```
    mongodb-runner startall && mongorella test && mongodb-runner killall
    ```
- [ ] Option for version, integrated with @imlucas/mongodb-version-manager

## License

MIT
