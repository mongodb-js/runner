/* eslint no-sync:0 */

var run = require('../');
var kill = require('kill-mongodb');
var debug = require('debug')('mongodb-runner:index.test');
var tmp = require('tmp');

describe('Test Spawning MongoDB Deployments', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone',
      port: 27000
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;
      done();
    });


    it('should start a standalone', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
      });
    });
  });

  describe('Replicaset', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset',
      port: 30000,
      topology: 'replicaset'
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;
      done();
    });

    it('should start a replicaset', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
      });
    });
  });

  describe('Cluster', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster',
      shardPort: 33000,
      configPort: 33100,
      port: 33200,
      shards: 3,
      topology: 'cluster'
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;
      done();
    });

    it('should start a cluster', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
      });
    });
  });
});
