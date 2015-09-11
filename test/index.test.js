var run = require('../');
var kill = require('kill-mongodb');
var assert = require('assert');
var mongodb = require('mongodb');
var debug = require('debug')('mongodb-runner:index.test');
var format = require('util').format;


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

  it('should start a standalone with auth', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-auth',
      port: 30000,
      auth: true
    };

    run(opts, function(err) {
      if (err) return done(err);
      verifyAuth(opts.port, function (err) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

  it.only('should start a replicaset with auth', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset-auth',
      topology: 'replicaset',
      port: 31000,
      auth: true
    };

    run(opts, function(err) {
      if (err) return done(err);
      verifyAuth(opts.port, function (err) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

  it('should start a cluster with auth', function(done) {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster-auth',
      topology: 'cluster',
      port: 32000,
      auth: true
    };

    run(opts, function(err) {
      if (err) return done(err);
      verifyAuth(opts.port, function (err) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

});

var verifyAuth = function (port, callback){
  debug("Verifying Auth");
  mongodb.MongoClient.connect(format('mongodb://localhost:%s/test', port), function(err, db) {
    if (err) return callback(err);
    db.collection('fruit').insertOne({'variety':'apple'}, function(err, r){
      console.log("ERROR: ", err)
      assert(err,'no error on insert');
      callback(null);
    })
  });
}
