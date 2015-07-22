// What actually calls mongodb-tools

var Standalone = require('mongodb-tools').ServerManager;
var Cluster = require('mongodb-tools').ShardingManager;
var Replicaset = require('mongodb-tools').ReplSetManager;

module.exports = function(opts, done) {
  var server;
  if (opts.topology === 'cluster') {

  } else if (opts.topology === 'replicaset') {
    server = new Replicaset({
      replSet: opts.name,
      port: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      rest: false,
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

