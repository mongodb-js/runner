var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var format = require('util').format;
var untildify = require('untildify');
var defaults = require('lodash.defaults');
var mkdirp = require('mkdirp');
var dbpath = require('mongodb-dbpath');
var mvm = require('mongodb-version-manager');
var mongodb = require('mongodb');
var backoff = require('backoff');
var debug = require('debug')('mongodb-runner');
var async = require('async');

/**
 * This file gets the ball rolling with the runner.
 * It puts together the relevant options and then passes them as command line
 * options to a worker process that it forks. That worker process is what
 * actually starts the mongodb deployments.
 */

var getPIDPath = function(opts, done) {
  var src = path.join(opts.pidpath, format('%s.pid', opts.name));
  done(null, src);
};

var getPID = function(opts, done) {
  getPIDPath(opts, function(err, pidPath) {
    if (err) return done(err);

    fs.exists(pidPath, function(exists) {
      if (!exists) return done(null, -1);

      fs.readFile(pidPath, 'utf-8', function(err, buf) {
        if (err) return done(err);

        done(null, parseInt(buf, 10));
      });
    });
  });
};


var killIfRunning = function(opts, done) {
  getPIDPath(opts, function(err, pidPath) {
    if (err) return done(err);
    getPID(opts, function(err, pid) {
      if (err) return done(err);

      if (pid === -1) {
        debug('no pid file');
        return done();
      }

      debug('killing existing pid', pid);
      try {
        process.kill(pid, 'SIGTERM');
      } catch (err) {
        if (err.code === 'ESRCH') {
          debug('orphaned pid file');
        }
      }
      fs.unlink(pidPath, done);
    });
  });
};

function connect(url, done) {
  var call = backoff.call(mongodb.MongoClient.connect, url, done);
  call.setStrategy(new backoff.ExponentialStrategy({
    randomisationFactor: 0,
    initialDelay: 10,
    maxDelay: 1000
  }));
  call.failAfter(60);
  call.start();
}

/**
 * This function starts a mongodb-runner-worker that is used to actually start MongoDB
 * deployments. This function by itself does NOT start deployments. Rather, it takes
 * the opts that it is passed, and sends them as command line ares to mongodb-runner-worker.
 * It then tries to connect to the MongoDB deployment to confirm that it is up and running.
 * @param  {object}   opts user specified options
 * @param  {Function} done callback
 */
var start = function(opts, done) {
  debug("starting!");
  // @todo (imlucas) Switch `killIfRunning` to `startIfNotRunning`
  // so you can bring up a replicaset/cluster when testing
  // and just leave it running in the background.
  killIfRunning(opts, function(err) {
    if (err) return done(err);

    getPIDPath(opts, function(err, pidPath) {
      if (err) return done(err);

      var bin = path.join(__dirname, '..', 'bin', 'mongodb-runner-worker.js');
      var args = [
        '--name=' + opts.name,
        '--dbpath=' + opts.dbpath,
        '--logpath=' + opts.logpath,
        '--port=' + opts.port,
        '--topology=' + opts.topology,
        '--bin=' + opts.bin,
        '--purge=' + opts.purge,
        '--auth_mechanism=' + opts.auth_mechanism
      ];
      if (opts.auth_mechanism === 'MONGODB_CR' || opts.auth_mechanism === 'SCRAM_SHA_1'){
        args.push('--username=' + opts.username);
        args.push('--password=' + opts.password);
      }

      if (opts.topology === 'replicaset') {
        args.push.apply(args, [
          '--arbiters=' + opts.arbiters,
          '--passives=' + opts.passives,
          '--secondaries=' + opts.secondaries
        ]);

        if (opts.auth_mechanism !== 'none'){
          args.push('--keyFile=' + opts.keyFile);
        }
      }

      if (opts.topology === 'cluster') {
        args.push.apply(args, [
          '--shards=' + opts.shards,
          '--routers=' + opts.routers,
          '--configs=' + opts.configs,
          '--shardPort=' + opts.shardPort,
          '--configPort=' + opts.configPort,
          '--arbiters=' + opts.arbiters,
          '--passives=' + opts.passives,
          '--secondaries=' + opts.secondaries
        ]);

        if (opts.auth_mechanism !== 'none'){
          args.push('--keyFile=' + opts.keyFile);
        }
      }
      var uri = buildURL(opts)
      debug('URI is %s', uri);

      var proc = child_process.fork(bin, args);
      debug('forked proc with pid', proc.pid, bin, args);
      debug('Writing pid to ', pidPath);
      fs.writeFile(pidPath, proc.pid, function(err) {
        if (err) return done(err);

        debug('waiting for a successful connection to `%s`...', uri);
        connect(uri, function(err, db){
          if (err) return console.error(err);
          debug('connected!');
          db.close();
          done(null, opts);
        });
      });
    });
  });
};

var buildURL = function (opts){
    var i = 0;
    var memberUris = [];
    switch(opts.topology) {
    case "standalone":
      var url = 'mongodb://localhost:' + opts.port;
      if (opts.auth_mechanism === 'MONGODB_CR' || opts.auth_mechanism === 'SCRAM_SHA_1'){
        url = 'mongodb://' + opts.username + ':' + opts.password + '@localhost:' + opts.port
         + "?authSource=admin";
      }
      return url;
    case "replicaset":
        var url = 'mongodb://';
        if (opts.auth_mechanism === 'MONGODB_CR' || opts.auth_mechanism === 'SCRAM_SHA_1'){
          url += opts.username + ':' + opts.password + '@';
        }
        for (i = 0; i < opts.secondaries; i++) {
          memberUris.push('localhost:' + (opts.port + i));
        }
        url += memberUris.join(',');
        url += '?replicaSet=' + opts.name;
        url += '&authSource=admin';
      return url;
    case "cluster":
        var url = 'mongodb://';
        if (opts.auth_mechanism === 'MONGODB_CR' || opts.auth_mechanism === 'SCRAM_SHA_1'){
          url += opts.username + ':' + opts.password + '@';
        }
        for (i = 0; i < opts.routers; i++) {
          memberUris.push('localhost:' + (opts.port + i));
        }
        url += memberUris.join(',');
        url += '?authSource=admin';
      return url;
    default:
      return "mongodb://localhost:28000"
  }
}

/**
 * cleans up relics from this specific run and then kills the process
 */
var stop = function (opts, done) {
  debug("stopping!");
  killIfRunning(opts, done);
}

var getDbPath = function(opts, done) {
  if (!opts.dbpath) {
    return dbpath(opts.name, function(err, res) {
      if (err) return done(err);
      opts.dbpath = res;
      done(null, opts);
    });
  }
  return done(null, opts);
};

/**
 * This function takes the opts given by the user and sets them to be either what the user
 * specifies or what the environment specifies, or a default
 * @param  {object}   opts user specified options
 * @param  {Function} done callback
 */
var configure = function(opts, done) {
  debug('configuring...');
  opts = defaults(opts, {
    topology: process.env.MONGODB_TOPOLOGY || 'standalone',
    version: process.env.MONGODB_VERSION || 'stable'
  });

  opts = defaults(opts, {
    name: opts.topology
  });

  mvm.use({
    version: opts.version
  }, function() {
    opts = defaults(opts, {
      logpath: untildify(process.env.MONGODB_LOGPATH || format('~/.mongodb/%s.log', opts.name)),
      pidpath: untildify(process.env.MONGODB_PIDPATH || '~/.mongodb/pid'),
      port: process.env.MONGODB_PORT || 28000,
      bin: process.env.MONGODB_BIN || 'mongod',
      auth_mechanism: process.env.MONGODB_AUTH_MECHANISM || 'none',
      purge: process.env.MONGODB_PURGE || true
    });

    if (opts.topology === 'replicaset') {
      opts = defaults(opts, {
        arbiters: process.env.MONGODB_ARBITERS || 0,
        secondaries: process.env.MONGODB_SECONDARIES || 2,
        passives: process.env.MONGODB_PASSIVES || 0
      });
    }

    if (opts.topology === 'cluster') {
      opts = defaults(opts, {
        shards: process.env.MONGODB_SHARDS || 1, // -> replsets
        routers: process.env.MONGODB_ROUTERS || 1, // -> mongoses
        configs: process.env.MONGODB_CONFIGS || 1,
        shardPort: process.env.MONGODB_SHARDS_PORT || 31000, // -> replsetStartPort
        configPort: process.env.MONGODB_CONFIGS_PORT || 35000, // -> configStartPort
        arbiters: process.env.MONGODB_ARBITERS || 0,
        secondaries: process.env.MONGODB_SECONDARIES || 2,
        passives: process.env.MONGODB_PASSIVES || 0
      });
    }

    debug('configured opts', opts);

    mkdirp(opts.pidpath, function(err) {
      if (err) return done(err);

      getDbPath(opts, function(err) {
        if (err) return done(err);

        if (opts.topology === 'standalone') return done(null, opts);

        mkdirp(opts.logpath, function(err) {
          done(err, opts);
        });
      });
    });
  });
};

/**
 * This function starts and stops the runner. You provide options that tell it
 * what authentication mechanisms to use and whether to start or stop the
 * deployment.
 * ex:
 *  var opts = {
 *    action: 'start',
 *    name: 'mongodb-runner-test-cluster-user-pass',
 *    shardPort: 32000,
 *    configPort: 32100,
 *    port: 32200,
 *    shards: 3,
 *    auth_mechanism: "SCRAM_SHA_1",
 *    username: 'adminUser',
 *    password: 'adminPass',
 *    topology: 'cluster',
 *    keyFile: 'mongodb-keyfile',
 *  };
 *  run(opts, function(err) {
 *    if (err) return done(err);
 *    done();
 *  });
*/

module.exports = function(opts, done) {
  delete opts._;
  var username = opts.username;
  var password = opts.password;
  configure(opts, function(err, opts) {
    if (err) return done(err);

    opts.action = opts.action || 'start';
    if (opts.action === 'start') return start(opts, done);
    if (opts.action === 'stop') return stop(opts, done);
    done(new Error('Unknown action.'));
  });
}

// worker actually calls mongodb-tools functiontions
module.exports.worker = require('./worker');
