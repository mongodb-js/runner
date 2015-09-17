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

var start = function(opts, done) {
  debug("starting!");
  // @todo (imlucas) Switch `killIfRunning` to `startIfNotRunning`
  // so you can bring up a replicaset/cluster when testing
  // and just leave it running in the background.
  killIfRunning(opts, function(err) {
    if (err) return done(err);

    getPIDPath(opts, function(err, pidPath) {
      if (err) return done(err);
      var uri = 'mongodb://localhost:' + opts.port;

      var i = 0;
      var memberUris = [];

      var bin = path.join(__dirname, '..', 'bin', 'mongodb-runner-worker.js');
      var args = [
        '--name=' + opts.name,
        '--dbpath=' + opts.dbpath,
        '--logpath=' + opts.logpath,
        '--port=' + opts.port,
        '--topology=' + opts.topology,
        '--bin=' + opts.bin,
        '--purge=' + opts.purge
      ];
      if (opts.auth){
        args.push('--auth');
      }

      if (opts.topology === 'replicaset') {
        args.push.apply(args, [
          '--arbiters=' + opts.arbiters,
          '--passives=' + opts.passives,
          '--secondaries=' + opts.secondaries
        ]);

        if (opts.auth){
          args.push('--keyFile=' + opts.keyFile);
        }

        uri = 'mongodb://';
        for (i = 0; i < opts.secondaries; i++) {
          memberUris.push('localhost:' + (opts.port + i));
        }
        uri += memberUris.join(',');
        uri += '?replicaSet=' + opts.name;
      }

      if (opts.topology === 'cluster') {
        args.push.apply(args, [
          '--shards=' + opts.shards,
          '--routers=' + opts.routers,
          '--configs=' + opts.configs,
          '--shardPort=' + opts.shardPort,
          '--configPort=' + opts.configPort
        ]);

        if (opts.auth){
          args.push('--keyFile=' + opts.keyFile);
        }

        uri = 'mongodb://';
        for (i = 0; i < opts.routers; i++) {
          memberUris.push('localhost:' + (opts.port + i));
        }
        uri += memberUris.join(',');
      }

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
      port: process.env.MONGODB_PORT || 27017,
      bin: process.env.MONGODB_BIN || 'mongod',
      auth: process.env.MONGODB_AUTH || false,
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
        configPort: process.env.MONGODB_CONFIGS_PORT || 35000 // -> configStartPort
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

var createAdmin = function (db, username, password, callback) {
  debug('Adding admin User');
  db.admin().addUser(username, password, 
    {roles: [ { role: "root", db: "admin" } ]},
    function(err, result) {
    debug('create admin result: '+ JSON.stringify(result));
    callback(err, db);
  });
}

module.exports = function(opts, done) {
  delete opts._;
  var username = opts.username;
  var password = opts.password;
  configure(opts, function(err, opts) {   
    if (err) return done(err);
    opts.action = opts.action || 'start'; 
    switch(opts.auth_mechanism) {
      case "SCRAM_SHA_1" || "MONGODB_CR":
        if (opts.topology === 'standalone'){
          if (opts.action === 'start'){
            opts.auth = true;
            return start(opts, function(err, res){
              async.waterfall([
              function(callback) {
                debug("first connect");
                var url = format('mongodb://localhost:%s/test', opts.port);
                mongodb.MongoClient.connect(url, callback);
              },
              function(db, callback) {
                debug("create admin");
                createAdmin(db, username, password, callback);
              },
              function(db, callback) {
                debug("close connection");
                db.close(callback);
              },
              ], function(err, db) {
                debug('done starting standalone with user/pass enabled');
                return done(err);
              });
            });
          }
          if (opts.action === 'stop'){
            return stop(opts, done); 
          }
          return done(new Error('Unknown action.'));
        }
        else if (opts.topology === 'replicaset'){
          if (opts.action === 'start'){
            // start without auth set
            return start(opts, function(err, res){
              async.waterfall([
             function(callback) {
                debug("waiting...");
                setTimeout(callback, 10000);
              },
              function(callback) {
                var url = format('mongodb://localhost:%s, localhost:%s/test?replicaSet=%s', 
                                 opts.port, opts.port+1, opts.name);
                mongodb.MongoClient.connect(url, callback);
              },
              function(db, callback) {
                debug("creating admin on master");
                createAdmin(db, username, password, callback);
              },
              function(db, callback) {
                debug("closing connection");
                setTimeout(function(){
                  db.close(callback);
                }, 1000);
              },
              function(result, callback) {
                debug("stopping replset");
                stop(opts, callback);
              },
              function(callback) {
                debug("restarting replset");
                opts.auth = true;
                opts.purge = false;
                start(opts, callback);
              },
              function(start_opts, callback) {
                debug("waiting...");
                setTimeout(callback, 10000);
              },
              ], function(err, db) {
                debug('done starting replicaset with user/pass enabled');
                return done(err);
              });
            });
          }
          if (opts.action === 'stop'){
            return stop(opts, done);
          }
          return done(new Error('Unknown action.'));
        }
        else if (opts.topology === 'cluster'){

        }
        done(new Error('Unknown topology.'));
      default:
        if (opts.action === 'start') return start(opts, done);
        if (opts.action === 'stop') return stop(opts, done);
        done(new Error('Unknown action.'));
    }
  });
}

// worker actually calls mongodb-tools functiontions
module.exports.worker = require('./worker');
