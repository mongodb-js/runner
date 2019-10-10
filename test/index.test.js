/* eslint no-sync:0 */

var run = require('../');
var kill = require('kill-mongodb');
var mvm = require('mongodb-version-manager');
var assert = require('assert');

describe('Test Spawning MongoDB Deployments', function() {
  before(function(done) {
    kill(done);
  });

  /**
   * TODO (imlucas) Can't remember reasoning for this test whatsoever.
   */
  describe.skip('Install', function() {
    var opts = {
      action: 'install',
      name: 'mongodb-runner-test-standalone',
      port: 20000
    };

    it('should only invoke mongodb-version-manager', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        mvm.current(function(err2, v) {
          if (err2) {
            return done(err2);
          }
          assert(v); // ensure not null
          done();
        });
      });
    });
  });

  describe('Standalone', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone',
      port: 20000
    };

    it('should start a standalone', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err2) {
          if (err2) {
            return done(err2);
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

    it('should start a replicaset', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err2) {
          if (err2) {
            return done(err2);
          }
          done();
        });
      });
    });
  });

  // @todo (imlucas): Figure out why this is failing.
  describe.skip('Cluster', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster',
      shardPort: 33000,
      configPort: 33100,
      port: 33200,
      shards: 3,
      topology: 'cluster'
    };

    it('should start a cluster', function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        opts.action = 'stop';
        run(opts, function(err2) {
          if (err2) {
            return done(err2);
          }
          done();
        });
      });
    });
  });
});
