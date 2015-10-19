/* eslint no-sync:0 */

var run = require('../');
var kill = require('kill-mongodb');
var debug = require('debug')('mongodb-runner:scram_sha_1.test');
var tmp = require('tmp');
var fs = require('fs');
var helper = require('./helper');
var verifyUserPassSuccess = helper.verifyUserPassSuccess;
var verifyWrongMechanismFailure = helper.verifyWrongMechanismFailure;
var verifyNoUserPassFailure = helper.verifyNoUserPassFailure;
var verifyBadUserPassFailure = helper.verifyBadUserPassFailure;

describe.skip('Test Spawning With SCRAM-SHA-1 Enabled', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-scram-sha-1',
      port: 27017,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass'
    };
    var tmpobj = null;

    before(function(done) {
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    after(function(done) {
      opts.action = 'stop';
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        tmpobj.removeCallback();
        done();
      });
    });

    it('should fail inserting with bad permissions', function(done) {
      verifyNoUserPassFailure(opts.port, opts.auth_mechanism, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting with bad credentials', function(done) {
      verifyBadUserPassFailure(opts.port, opts.auth_mechanism, 'foo', 'bar', function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with good credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'MONGODB-CR', opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Replicaset', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset-scram-sha-1',
      port: 31000,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'replicaset'
    };
    var tmpKeyFile = null;

    before(function(done) {
      tmpKeyFile = tmp.fileSync();
      fs.writeFileSync(tmpKeyFile.name, 'testkeyfiledata');
      debug('KeyFile: ', tmpKeyFile.name);
      opts.keyFile = tmpKeyFile.name;

      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    after(function(done) {
      opts.action = 'stop';
      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail inserting with bad permissions', function(done) {
      verifyNoUserPassFailure(opts.port, opts.auth_mechanism, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting with bad credentials', function(done) {
      verifyBadUserPassFailure(opts.port, opts.auth_mechanism, 'foo', 'bar', function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with good credentials to all members of a replicaset', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        verifyUserPassSuccess(opts.port + 1, opts.auth_mechanism, opts.username, opts.password, function(err2) {
          if (err2) {
            return done(err2);
          }
          verifyUserPassSuccess(opts.port + 2, opts.auth_mechanism, opts.username, opts.password, function(err3) {
            if (err3) {
              return done(err3);
            }
            done();
          });
        });
      });
    });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'MONGODB-CR', opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Cluster', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster-scram-sha-1',
      shardPort: 34000,
      configPort: 34100,
      port: 34200,
      shards: 3,
      mongoses: 2,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'cluster'
    };
    var tmpKeyFile = null;

    before(function(done) {
      tmpKeyFile = tmp.fileSync();
      fs.writeFileSync(tmpKeyFile.name, 'testkeyfiledata');
      debug('KeyFile: ', tmpKeyFile.name);
      opts.keyFile = tmpKeyFile.name;

      run(opts, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // after(function(done) {
    //   opts.action = 'stop';
    //   run(opts, function(err) {
    //     if (err) return done(err);
    //     //tmpDir.removeCallback();
    //     //tmpKeyFile.removeCallback();
    //     done();
    //   });
    // });

    it('should fail inserting with bad permissions', function(done) {
      verifyNoUserPassFailure(opts.port, opts.auth_mechanism, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting with bad credentials', function(done) {
      verifyBadUserPassFailure(opts.port, opts.auth_mechanism, 'foo', 'bar', function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with good credentials to all mongoses', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        verifyUserPassSuccess(opts.port + 1, opts.auth_mechanism, opts.username, opts.password, function(err2) {
          if (err2) {
            return done(err2);
          }
          done();
        });
      });
    });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'MONGODB-CR', opts.username, opts.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });
});
