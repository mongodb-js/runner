// What actually calls mongodb-tools

var Standalone = require('mongodb-tools').ServerManager;
var Cluster = require('mongodb-tools').ShardingManager;
var Replicaset = require('mongodb-tools').ReplSetManager;
var path = require('path');
var debug = require('debug')('mongodb-runner:worker');
var mongodb = require('mongodb');

module.exports = function(opts, done) {
  var server;
  debug("worker opts: ", opts);
  if (opts.topology === 'cluster') {
    if (opts.bin !== 'mongod') {
      var dir = path.dirname(opts.bin);
      opts.mongosBin = path.join(dir, 'mongos');
      opts.mongodBin = path.join(dir, 'mongod');
    }
    delete opts.bin;

    /**
     * ## Auth Providers
     */
    /**
     * ### none
     * null => no auth, yo.
     */
    /**
     * ### scram-sha-1
     *
     * @see https://github.com/mongodb/node-mongodb-native/blob/2.0/test/functional/scram_tests.js
     *
     * Only available if require('get-mongodb-version').is(opts.bin, '>=2.7.5')
     * pass to Standalone|Cluster|Replicaset constructor as well:
     *   {
     *     setParameter: 'authenticationMechanisms=SCRAM-SHA-1'
     *   }
     * And call `server.setCredentials('scram-sha-1', username, password, db, done)`
     *
     *
     * // User and password
     * var user = 'test';
     * var password = 'test';
     * MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
     * // Create an admin user
     * db.admin().addUser(user, password, function(err, result) {
     * // Attempt to reconnect authenticating against the admin database
     * MongoClient.connect('mongodb://test:test@localhost:27017/test?'
     * + 'authMechanism=SCRAM-SHA-1&authSource=admin&maxPoolSize=5',
     */
    /**
     * ### mongocr (mongodb-cr)
     *
     * http://docs.mongodb.org/manual/core/authentication/#mongodb-cr-authentication
     *
     */
    /**
     * ### x509 (ssl)
     * @see http://docs.mongodb.org/manual/core/authentication/#x-509-certificate-authentication
     */
    /**
     * ## Enterprise-Only Auth Providers
     */
    /**
     * ### plain
     * a.k.a ldap
     *
     * MongoDB Enterprise Edition versions `2.5.0` and newer support the SASL PLAIN
     * authentication mechanism, initially intended for delegating authentication
     * to an LDAP server. Using the SASL PLAIN mechanism is very similar to MONGODB-CR.
     * These examples use the $external virtual database for LDAP support:
     * SASL PLAIN is a clear-text authentication mechanism. We strongly recommend
     * that you connect to MongoDB using SSL with certificate validation when using
     * the PLAIN mechanism:
     *
     * ```c
     * mongoc_client_t *client;
     * client = mongoc_client_new ("mongodb://user:password@example.com/'
     * + '?authMechanism=PLAIN&authSource=$external");
     * ```
     */
    /**
     * ### gssapi (kerberos)
     * @see http://docs.mongodb.org/manual/core/authentication/#kerberos-authentication
     */
    /**
     * ### sspi (kerberos on windows)
     */
    var options = {
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
    };
    if (opts.auth) {
      options.auth = null;
    }
    server = new Cluster(options);
  } else if (opts.topology === 'replicaset') {
    var options = {
      replSet: opts.name,
      startPort: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      arbiters: opts.arbiters,
      passives: opts.passives,
      secondaries: opts.secondaries
    };
    if (opts.auth) {
      options.auth = null;
    }
    server = new Replicaset(options);
  } else {
    var options = {
      host: 'localhost',
      port: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      rest: false,
    };
    if (opts.auth) {
      options.auth = null;
    }
    server = new Standalone(options);
  }

  debug('starting `%s`...', opts.name);
  // @todo: Handle mongodb already running (started outside of mongodb-runner)
  // gracefully so you can start mongod in weird ways and not have to change your
  // module's package.json.
  server.start({
    kill: false
  }, function(){
    debug('done starting server');
    done();
  });

  process.on('SIGTERM', function() {
    debug('stopping `%s`...', opts.name);
    server.stop({
      signal: 9
    }, function() {
      debug('`%s` stopped', opts.name);
    });
  });
};
