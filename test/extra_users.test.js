/* eslint no-sync:0 */
var run = require('../');
var kill = require('kill-mongodb');
var debug = require('debug')('mongodb-runner:extra_users.test');
var tmp = require('tmp');
var fs = require('fs');
var helper = require('./helper');
var verifyUserPassSuccess = helper.verifyUserPassSuccess;
var verifyWrongDBUserPassFailure = helper.verifyWrongDBUserPassFailure;

var user2 = {
  username: 'user2',
  password: 'pass2',
  roles: [
    {
      role: 'readWriteAnyDatabase',
      db: 'admin'
    }
  ]
};

var user3 = {
  username: 'user3',
  password: 'pass3',
  roles: [
    {
      role: 'read',
      db: 'reporting'
    },
    {
      role: 'read',
      db: 'products'
    },
    {
      role: 'read',
      db: 'sales'
    },
    {
      role: 'readWrite',
      db: 'test'
    }
  ]
};

describe('Test Extra Users With Different Permissions', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-extra-users',
      port: 36000,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass',
      secondUser: user2,
      thirdUser: user3
    };
    var tmpobj = null;

    before(function(done) {
      tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;
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

    it('should connect and insert with user2 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.secondUser.username, opts.secondUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should fail writing with user3 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism,
        opts.thirdUser.username, opts.thirdUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, opts.thirdUser.username,
        opts.thirdUser.password, function(err) {
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
      name: 'mongodb-runner-test-replicaset-extra-users',
      port: 37000,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'replicaset',
      secondUser: user2,
      thirdUser: user3
    };
    var tmpobj = null;

    before(function(done) {
      tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;

      var tmpKeyFile = tmp.fileSync();
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

    it('should connect and insert with user2 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.secondUser.username, opts.secondUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should fail writing with user3 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism,
        opts.thirdUser.username, opts.thirdUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.thirdUser.username, opts.thirdUser.password, function(err) {
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
      name: 'mongodb-runner-test-cluster-extra-users',
      port: 37000,
      auth_mechanism: 'SCRAM-SHA-1',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'cluster',
      secondUser: user2,
      thirdUser: user3
    };
    var tmpobj = null;

    before(function(done) {
      tmpobj = tmp.dirSync({
        unsafeCleanup: true
      });
      debug('DB Dir: ', tmpobj.name);
      opts.dbpath = tmpobj.name;

      var tmpKeyFile = tmp.fileSync();
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

    it('should connect and insert with user2 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism,
        opts.secondUser.username, opts.secondUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should fail writing with user3 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism,
        opts.thirdUser.username, opts.thirdUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, opts.thirdUser.username,
        opts.thirdUser.password, function(err) {
          if (err) {
            return done(err);
          }
          done();
        });
    });
  });
});
