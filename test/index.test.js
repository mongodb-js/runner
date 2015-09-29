var run = require('../');
var kill = require('kill-mongodb');

describe('run', function() {
  before(function(done) {
    kill(done);
  });
  it('should start a standalone', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone',
      port: 27000
    };

    run(opts, function(err) {
      if (err) return done(err);

      opts.action = 'stop';
      run(opts, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });

  it.skip('should start a replicaset', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset',
      topology: 'replicaset',
      port: 28000
    };

    run(opts, function(err) {
      if (err) return done(err);

      opts.action = 'stop';
      run(opts, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });
  it('should start a cluster', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster',
      topology: 'cluster',
      port: 29000
    };

    run(opts, function(err) {
      if (err) return done(err);

      opts.action = 'stop';
      run(opts, function(err) {
        if (err) return done(err);
        done();
      });
    });
  });
});
