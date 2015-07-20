// What actually calls mongodb-tools

var Standalone = require('mongodb-tools').ServerManager;
var Cluster = require('mongodb-tools').ShardingManager;
var Replicaset = require('mongodb-tools').ReplSetManager;

module.exports = function(opts, done) {
  var server = new Standalone({
    host: 'localhost',
    port: opts.port,
    storageEngine: opts.storage_engine,
    dbpath: opts.dbpath,
    logpath: opts.logpath,
    rest: false
  });
  server.start({

  }, done);

  process.on('SIGTERM', function() {
    server.stop({
      signal: 9
    }, function() {
      console.log('server stopped');
    });
  });
};

