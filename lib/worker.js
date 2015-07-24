// What actually calls mongodb-tools

var Standalone = require('mongodb-tools').ServerManager;
var Cluster = require('mongodb-tools').ShardingManager;
var Replicaset = require('mongodb-tools').ReplSetManager;
var path = require('path');

module.exports = function(opts, done) {
  var server;
  if (opts.topology === 'cluster') {
    if (opts.bin !== 'mongod') {
      var dir = path.dirname(opts.bin);
      opts.mongosBin = path.join(dir, 'mongos');
      opts.mongodBin = path.join(dir, 'mongod');
    }
    delete opts.bin;

    server = new Cluster({
      replSet: opts.name,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      replsets: opts.shards,
      mongoses: opts.routers,
      configs: opts.configs,
      mongosStartPort: opts.port,
      replsetStartPort: opts.shardPort,
      configStartPort: opts.configPort,
      mongosBin: opts.mongosBin,
      mongodBin: opts.mongodBin
    });
  } else if (opts.topology === 'replicaset') {
    server = new Replicaset({
      replSet: opts.name,
      startPort: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      arbiters: opts.arbiters,
      passives: opts.passives,
      secondaries: opts.secondaries
    });
  } else {
    server = new Standalone({
      host: 'localhost',
      port: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      rest: false
    });
  }
  server.start({}, done);

  process.on('SIGTERM', function() {
    server.stop({
      signal: 9
    }, function() {
      console.log('server stopped');
    });
  });
};

