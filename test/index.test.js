var run = require('../');
var kill = require('kill-mongodb');
var assert = require('assert');
var mongodb = require('mongodb');
var debug = require('debug')('mongodb-runner:index.test');
var format = require('util').format;
var tmp = require('tmp');
var fs = require('fs');

describe('Test Spawning MongoDB Deployments', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone', function() {

    describe('Simple', function() {

      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-standalone',
        port: 27000
      };
      var tmpobj = null;

      before(function(done) {
        tmpobj = tmp.dirSync({unsafeCleanup:true});
        debug("DB Dir: ", tmpobj.name);
        opts.dbpath = tmpobj.name;
        done();
      });

      after(function(done) {
        tmpobj.removeCallback();
        done();
      });

      it('should start a standalone', function(done) {
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

    describe('Username/Password Auth', function() {
      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-standalone-user-pass',
        port: 30000,
        auth_mechanism: "SCRAM_SHA_1",
        username: "adminUser",
        password: "adminPass"
      };
      var tmpobj = null;

      before(function(done) {
        tmpobj = tmp.dirSync({unsafeCleanup:true});
        debug("DB Dir: ", tmpobj.name);
        opts.dbpath = tmpobj.name;
        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });

      after(function(done) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          tmpobj.removeCallback();
          done();
        });
      });

      it('should fail inserting with bad permissions', function(done) {
        verifyNoUserPassFailure(opts.port, function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should fail connecting with bad credentials', function(done) {
        verifyBadUserPassFailure(opts.port, "foo", "bar", function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should connect and insert with good credentials', function(done) {
        verifyUserPassSuccess(opts.port, opts.username, opts.password, function (err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

  describe('Replicaset', function() {

    describe('Simple', function() {

      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-replicaset',
        port: 28000,
        topology: 'replicaset'
      };

      it('should start a replicaset', function(done) {
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

    describe('Username/Password Auth', function() {
      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-replicaset-user-pass',
        port: 31000,
        auth_mechanism: "SCRAM_SHA_1",
        username: 'adminUser',
        password: 'adminPass',
        topology: 'replicaset',
        keyFile: 'mongodb-keyfile',
      };
      var tmpDir = null;
      var tmpKeyFile = null;

      before(function(done) {
        tmpDir = tmp.dirSync({unsafeCleanup:true});
        opts.dbpath = tmpDir.name;
        debug("DB Dir: ", tmpDir.name);
        
        tmpKeyFile = tmp.fileSync();
        fs.writeFileSync(tmpKeyFile.name, 'testkeyfiledata');
        debug("KeyFile: ", tmpKeyFile.name);
        opts.keyFile = tmpKeyFile.name;

        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });

      after(function(done) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          //tmpDir.removeCallback();
          //tmpKeyFile.removeCallback();
          done();
        });
      });

      it('should fail inserting with bad permissions', function(done) {
        verifyNoUserPassFailure(opts.port, function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should fail connecting with bad credentials', function(done) {
        verifyBadUserPassFailure(opts.port, "foo", "bar", function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should connect and insert with good credentials', function(done) {
        verifyUserPassSuccess(opts.port, opts.username, opts.password, function (err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });

 describe('Cluster', function() {

    describe('Simple', function() {

      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-cluster',
        shardPort: 29000,
        configPort: 29100,
        topology: 'cluster'
      };

      it('should start a cluster', function(done) {
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

    describe('Username/Password Auth', function() {
      var opts = {
        action: 'start',
        name: 'mongodb-runner-test-cluster-user-pass',
        shardPort: 32000,
        configPort: 32100,
        port: 32200,
        shards: 3,
        auth_mechanism: "SCRAM_SHA_1",
        username: 'adminUser',
        password: 'adminPass',
        topology: 'cluster',
        keyFile: 'mongodb-keyfile',
      };
      var tmpDir = null;
      var tmpKeyFile = null;

      before(function(done) {
        tmpDir = tmp.dirSync({unsafeCleanup:true});
        opts.dbpath = tmpDir.name;
        debug("DB Dir: ", tmpDir.name);
        
        tmpKeyFile = tmp.fileSync();
        fs.writeFileSync(tmpKeyFile.name, 'testkeyfiledata');
        debug("KeyFile: ", tmpKeyFile.name);
        opts.keyFile = tmpKeyFile.name;

        run(opts, function(err) {
          if (err) return done(err);
          done();
        });
      });

      after(function(done) {
        opts.action = 'stop';
        run(opts, function(err) {
          if (err) return done(err);
          //tmpDir.removeCallback();
          //tmpKeyFile.removeCallback();
          done();
        });
      });

      it('should fail inserting with bad permissions', function(done) {
        verifyNoUserPassFailure(opts.port, function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should fail connecting with bad credentials', function(done) {
        verifyBadUserPassFailure(opts.port, "foo", "bar", function (err) {
          if (err) return done(err);
          done();
        });
      });

      it('should connect and insert with good credentials', function(done) {
        verifyUserPassSuccess(opts.port, opts.username, opts.password, function (err) {
          if (err) return done(err);
          done();
        });
      });
    });
  });


});

var verifyNoUserPassFailure = function (port, callback){
  debug("Verifying Auth");
  mongodb.MongoClient.connect(format('mongodb://localhost:%s/test?authSource=admin', port), 
                              function(err, db) {
    if (err) return callback(err);
    db.collection('fruit').insertOne({'variety':'apple'}, function(err){
      assert(err, 'No error on insert with no authorization');
      callback(null);
    });
  });
}

var verifyBadUserPassFailure = function (port, username, password, callback){
  debug("Verifying Auth");
  mongodb.MongoClient.connect(format('mongodb://%s:%s@localhost:%s/test?authSource=admin', 
                              username, password, port), function(err) {
    assert(err,'No error on connect with bad credentials');
    callback(null);
  });
}

var verifyUserPassSuccess = function (port, username, password, callback){
  debug("Verifying Auth");
  var url = format('mongodb://%s:%s@localhost:%s/test?authSource=admin', 
                   username, password, port);
  mongodb.MongoClient.connect(url, function(err, db) {
    if (err) return callback(err);
    db.collection('fruit').insertOne({'variety':'apple'}, function(err){
      assert.ifError(err);
      callback(null);
    });
  });
}
