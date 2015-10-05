var run = require('../');
var kill = require('kill-mongodb');
var assert = require('assert');
var mongodb = require('mongodb');
var debug = require('debug')('mongodb-runner:scram_sha_1.test');
var format = require('util').format;
var tmp = require('tmp');
var fs = require('fs');
var helper = require('./helper');
var verifySSLSuccess = helper.verifySSLSuccess;
var verifySSLFailure = helper.verifySSLFailure;

var serverPasswordCert = 'certs/server_password.pem';
var serverPassword = 'serverpassword';
var clientPasswordCert = 'certs/client_password.pem';
var clientPassword = 'clientpassword';

var ca = 'certs/ca.pem';
var brokenCa = 'certs/broken_ca.pem';
var clientCert = 'certs/client.pem';
var serverCert = 'certs/server.pem';
var badCert = 'certs/expired_cert.pem';
var selfSignCert = 'certs/selfsign_cert.pem';
var crl = 'certs/crl.pem';

describe('Test Spawning With SSL Enabled', function() {
  before(function(done) {
    kill(done);
  });

  describe('Standalone with Password, forcing cert validation on both ends', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-ssl',
      port: 39000,
      version: '3.0.5',
      sslMode: 'requireSSL',
      sslAllowConnectionsWithoutCertificates: false,
      sslPEMKeyFile: serverPasswordCert,
      sslCAFile: ca,
      sslValidate: true,
      sslPEMKeyPassword: serverPassword
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with an expired cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, badCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Standalone without Password and allowing connections without certs', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-standalone-ssl2',
      port: 40000,
      version: '3.0.5',
      sslMode: 'requireSSL',
      sslAllowConnectionsWithoutCertificates: true,
      sslPEMKeyFile: serverCert,
      sslValidate: true,
      sslCAFile: ca,
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation on', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Replicaset with Password, forcing cert validation on both ends', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset-ssl',
      port: 41000,
      version: '3.0.5',
      sslMode: 'requireSSL',
      topology: 'replicaset',
      sslAllowConnectionsWithoutCertificates: false,
      sslPEMKeyFile: serverPasswordCert,
      sslCAFile: ca,
      sslValidate: true,
      sslPEMKeyPassword: serverPassword
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with an expired cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, badCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Replicaset without Password and allowing connections without certs', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-replicaset-ssl2',
      port: 42000,
      version: '3.0.5',
      topology: 'replicaset',
      sslMode: 'requireSSL',
      sslAllowConnectionsWithoutCertificates: true,
      sslPEMKeyFile: serverCert,
      sslValidate: true,
      sslCAFile: ca,
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation on', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Cluster with Password, forcing cert validation on both ends', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster-ssl',
      shardPort: 41000,
      configPort: 41100,
      port: 41200,
      shards: 3,
      mongoses: 2,
      version: '3.0.5',
      sslMode: 'requireSSL',
      topology: 'replicaset',
      sslAllowConnectionsWithoutCertificates: false,
      sslPEMKeyFile: serverPasswordCert,
      sslCAFile: ca,
      sslValidate: true,
      sslPEMKeyPassword: serverPassword
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with an expired cert', function(done) {
      verifySSLFailure(opts.port, opts.topology, ca, badCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });

  describe('Cluster without Password and allowing connections without certs', function() {
    var opts = {
      action: 'start',
      name: 'mongodb-runner-test-cluster-ssl2',
      shardPort: 42000,
      configPort: 42100,
      port: 42200,
      shards: 3,
      mongoses: 2,
      version: '3.0.5',
      topology: 'replicaset',
      sslMode: 'requireSSL',
      sslAllowConnectionsWithoutCertificates: true,
      sslPEMKeyFile: serverCert,
      sslValidate: true,
      sslCAFile: ca,
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
        //tmpobj.removeCallback();
        done();
      });
    });

    it('should succeed with proper ssl parameters and ca', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no password on the cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, clientCert, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no ca and no validation', function(done) {
      verifySSLSuccess(opts.port, opts.topology, null, clientPasswordCert, clientPassword, false, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should fail with no ca and validation on', function(done) {
      verifySSLFailure(opts.port, opts.topology, null, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    // it('should fail with wrong password', function(done) {
    //   verifySSLFailure(opts.port, opts.topology, ca, clientPasswordCert, 'wrongpassword', true, function(err) {
    //     if (err) return done(err);
    //     done();
    //   });
    // });

    it('should fail with a broken ca', function(done) {
      verifySSLFailure(opts.port, opts.topology, brokenCa, clientPasswordCert, clientPassword, true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });

    it('should succeed with no cert', function(done) {
      verifySSLSuccess(opts.port, opts.topology, ca, null, '', true, function(err) {
        if (err) {
          return done(err);
        }
        done();
      });
    });
  });
});
