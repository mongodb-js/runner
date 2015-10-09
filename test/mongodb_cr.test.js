/* eslint no-sync:0 */
var run = require('../');
var kill = require('kill-mongodb');
var debug = require('debug')('mongodb-runner:mongodb_cr.test');
var tmp = require('tmp');
var fs = require('fs');
var helper = require('./helper');
var verifyUserPassSuccess = helper.verifyUserPassSuccess;
var verifyWrongMechanismFailure = helper.verifyWrongMechanismFailure;
var verifyNoUserPassFailure = helper.verifyNoUserPassFailure;
var verifyBadUserPassFailure = helper.verifyBadUserPassFailure;

describe.skip('Test Spawning With MONGODB-CR Enabled', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-mongodb-cr',
      port: 29000,
      auth_mechanism: 'MONGODB-CR',
      username: 'adminUser',
      password: 'adminPass',
      version: '2.6'
    };
    before(function(done) {
      run(opts, done);
    });

    after(function(done) {
      opts.action = 'stop';
      run(opts, done);
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
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.username, opts.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'SCRAM-SHA-1',
        opts.username, opts.password, function(err) {
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
      name: 'mongodb-runner-test-replicaset-mongodb-cr',
      port: 32000,
      auth_mechanism: 'MONGODB-CR',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'replicaset',
      version: '2.6'
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
        // tmpDir.removeCallback();
        // tmpKeyFile.removeCallback();
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

    it('should connect and insert with good credentials to all '
      + 'members of a replicaset', function(done) {
        verifyUserPassSuccess(opts.port, opts.auth_mechanism,
          opts.username, opts.password, function(err) {
            if (err) {
              return done(err);
            }
            verifyUserPassSuccess(opts.port + 1, opts.auth_mechanism,
              opts.username, opts.password, function(err) {
                if (err) {
                  return done(err);
                }
                verifyUserPassSuccess(opts.port + 2, opts.auth_mechanism,
                  opts.username, opts.password, function(err) {
                    if (err) {
                      return done(err);
                    }
                    done();
                  });
              });
          });
      });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'SCRAM-SHA-1',
        opts.username, opts.password, function(err) {
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
      name: 'mongodb-runner-test-cluster-mongodb-cr',
      shardPort: 35000,
      configPort: 35100,
      port: 35200,
      shards: 3,
      auth_mechanism: 'MONGODB-CR',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'cluster',
      version: '2.6'
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
        // tmpDir.removeCallback();
        // tmpKeyFile.removeCallback();
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
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.username, opts.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should connect and insert with good credentials to all mongoses', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.username, opts.password, function(err) {
          if (err) {
            return done(err);
          }
          verifyUserPassSuccess(opts.port + 1, opts.auth_mechanism,
            opts.username, opts.password, function(err) {
              if (err) {
                return done(err);
              }
              done();
            });
        });
    });

    it('should fail to connect with wrong auth mechanism', function(done) {
      verifyWrongMechanismFailure(opts.port, 'SCRAM-SHA-1',
        opts.username, opts.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });
  });
});
