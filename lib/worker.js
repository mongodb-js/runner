// What actually calls mongodb-tools

var Standalone = require('mongodb-tools').ServerManager;
var Cluster = require('mongodb-tools').ShardingManager;
var Replicaset = require('mongodb-tools').ReplSetManager;
var path = require('path');
var debug = require('debug')('mongodb-runner:worker');
var mongodb = require('mongodb');

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

/**
 * This file is a worker process that actually starts the mongodb deployments.
 */
module.exports = function(opts, done) {
  var server;
  debug("worker opts: " + JSON.stringify(opts));
  opts.purge = (opts.purge === 'true');

  /**
   * Get opts form the commandline and create an options object.
   * This options object is passed to `mongodb-tools` which actually
   * starts the mongodb processes
   */
  if (opts.topology === 'cluster') {
    if (opts.bin !== 'mongod') {
      var dir = path.dirname(opts.bin);
      opts.mongosBin = path.join(dir, 'mongos');
      opts.mongodBin = path.join(dir, 'mongod');
    }
    delete opts.bin;
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
      mongodBin: opts.mongodBin,
      purge: opts.purge,
      replicasetOptions: {
        secondaries: opts.secondaries,
        arbiters: opts.arbiters,
        passives: opts.passives
      },
      configsOptions: {},
      mongosOptions: {},
    };
    if (opts.auth) {
      options.replicasetOptions.auth = null;
      options.replicasetOptions.keyFile = opts.keyFile;
      options.configsOptions.auth = null;
      options.configsOptions.keyFile = opts.keyFile;
      options.mongosOptions.keyFile = opts.keyFile;
    }
    server = new Cluster(options);
  }
  else if (opts.topology === 'replicaset') {
    var options = {
      replSet: opts.name,
      startPort: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      arbiters: opts.arbiters,
      passives: opts.passives,
      secondaries: opts.secondaries,
      purge: opts.purge
    };
    if (opts.auth) {
      options.auth = null;
      options.keyFile = opts.keyFile;
    }
    server = new Replicaset(options);
  }
  else {
    var options = {
      host: 'localhost',
      port: opts.port,
      storageEngine: opts.storage_engine,
      dbpath: opts.dbpath,
      logpath: opts.logpath,
      rest: false,
      purge: opts.purge
    };
    if (opts.auth) {
      options.auth = null;
    }
    server = new Standalone(options);
  }
  if (opts.auth){
    server.setCredentials('scram-sha-1', 'admin', opts.username, opts.password);
  }

  debug('starting `%s`...', opts.name);
  // @todo: Handle mongodb already running (started outside of mongodb-runner)
  // gracefully so you can start mongod in weird ways and not have to change your
  // module's package.json.
  debug('purge: ' + opts.purge);
  server.start({
    kill: false,
    purge: opts.purge,
  }, function(){
    debug('done starting server');
    done();
  });

  /**
   * When this process receives a SIGTERM, this stops the server processes
   * by calling `mongodb-tools`'s stop function.
   */
  process.on('SIGTERM', function() {
    debug('stopping `%s`...', opts.name);
    server.stop({
      signal: 9
    }, function() {
      debug('`%s` stopped', opts.name);
    });
  });

  /**
   * When this process receives a SIGCONT, this restarts the server processes
   * by calling `mongodb-tools`'s restart function.
   */
  process.on('SIGCONT', function() {
    debug('restarting `%s`...', opts.name);
    server.restart({
      signal: 18
    }, function() {
      debug('`%s` restarted', opts.name);
    });
  });
};
