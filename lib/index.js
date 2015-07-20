var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var format = require('util').format;
var untildify = require('untildify');
var defaults = require('lodash.defaults');
var mkdirp = require('mkdirp');
var debug = require('debug')('mongodb-runner');

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

var start = function(opts, done) {
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
        '--topology=' + opts.topology
      ];

      var proc = child_process.fork(bin, args);
      debug('forked proc with pid', proc.pid, bin, args);
      debug('Writing pid to ', pidPath);
      fs.writeFile(pidPath, proc.pid, done);
    });
  });
};

var stop = killIfRunning;

var configure = function(opts, done) {
  opts = defaults(opts, {
    topology: 'standalone'
  });
  if (opts.topology === 'standalone') {
    opts = defaults(opts, {
      dbpath: untildify(format('~/.mongodb/data/%s', opts.name)),
      logpath: untildify(format('~/.mongodb/%s.log', opts.name)),
      pidpath: untildify('~/.mongodb/pid'),
      topology: 'standalone',
      port: 27017
    });
  } else {
    return done(new Error('Unknown topology'));
  }

  debug('configured opts', opts);

  mkdirp(opts.pidpath, function(err) {
    if (err) return done(err);

    mkdirp(opts.dbpath, function(err) {
      if (err) return done(err);
      done(null, opts);
    });
  });
};

module.exports = function(opts, done) {
  delete opts._;

  configure(opts, function(err, opts) {
    if (err) return done(err);

    opts.action = opts.action || 'start';
    if (opts.action === 'start') return start(opts, done);
    if (opts.action === 'stop') return stop(opts, done);
    done(new Error('Unknown action.'));
  });
};

// worker actually calls mongodb-tools functiontions
module.exports.worker = require('./worker');
