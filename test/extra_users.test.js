/* eslint no-sync:0 */
var run = require('../');
var kill = require('kill-mongodb');
var debug = require('debug')('mongodb-runner:extra_users.test');
var tmp = require('tmp');
var fs = require('fs');
var helper = require('./helper');
var verifyUserPassSuccess = helper.verifyUserPassSuccess;
var verifyWrongDBUserPassFailure = helper.verifyWrongDBUserPassFailure;
var verifyCannotConnectToDBUserPassFailure = helper.verifyCannotConnectToDBUserPassFailure;

var user2 = {
  username: 'user2',
  password: 'pass2',
  db: 'admin',
  roles: [
    {
      role: 'read',
      db: 'fruit'
    },
    {
      role: 'readWrite',
      db: 'test'
    }
  ]
};

var user3 = {
  username: 'user3',
  password: 'pass3',
  db: 'test',
  roles: [
    {
      role: 'read',
      db: 'fruit'
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
      auth_mechanism: 'MONGODB',
      username: 'adminUser',
      password: 'adminPass',
      secondUser: user2,
      thirdUser: user3
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
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
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'admin', 'test', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail writing with user2 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'fruit', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting to admin with user3 credentials', function(done) {
      verifyCannotConnectToDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'admin', opts.thirdUser.username, opts.thirdUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'test', 'test', opts.thirdUser.username, opts.thirdUser.password, function(err) {
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
      auth_mechanism: 'MONGODB',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'replicaset',
      secondUser: user2,
      thirdUser: user3
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
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
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'admin', 'test', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail writing with user2 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'fruit', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting to admin with user3 credentials', function(done) {
      verifyCannotConnectToDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'admin', opts.thirdUser.username, opts.thirdUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'test', 'test', opts.thirdUser.username, opts.thirdUser.password, function(err) {
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
      port: 38000,
      auth_mechanism: 'MONGODB',
      username: 'adminUser',
      password: 'adminPass',
      topology: 'cluster',
      secondUser: user2,
      thirdUser: user3
    };

    before(function(done) {
      var tmpobj = tmp.dirSync({
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
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'admin', 'test', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail writing with user2 credentials', function(done) {
      verifyWrongDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'fruit', opts.secondUser.username, opts.secondUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail connecting to admin with user3 credentials', function(done) {
      verifyCannotConnectToDBUserPassFailure(opts.port, opts.auth_mechanism, 'admin', 'admin', opts.thirdUser.username, opts.thirdUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should connect and insert with user3 credentials', function(done) {
      verifyUserPassSuccess(opts.port, opts.auth_mechanism, 'test', 'test', opts.thirdUser.username, opts.thirdUser.password, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });
});
