var assert = require('assert');
var mongodb = require('mongodb');
var format = require('util').format;
var fs = require('fs');

var createSSLOptions = function(topology, sslCA, sslCert, sslKey,
  sslPass, sslValidate) {
  var connectionOptions = {
    uri_decode_auth: true,
    db: {},
    server: {},
    replSet: {
      connectWithNoPrimary: true
    },
    mongos: {}
  };

  if (sslValidate !== null) {
    connectionOptions.server.sslValidate = sslValidate;
    if (topology === 'replicaset' || topology === 'cluster') {
      connectionOptions.replSet.sslValidate = sslValidate;
    }
    if (topology === 'cluster') {
      connectionOptions.mongos.sslValidate = sslValidate;
    }
  }
  if (sslCA) {
    connectionOptions.server.sslCA = fs.readFileSync(sslCA, 'utf8');
    if (topology === 'replicaset' || topology === 'cluster') {
      connectionOptions.replSet.sslCA = fs.readFileSync(sslCA, 'utf8');
    }
    if (topology === 'cluster') {
      connectionOptions.mongos.sslCA = fs.readFileSync(sslCA, 'utf8');
    }
  }
  if (sslCert) {
    connectionOptions.server.sslCert = fs.readFileSync(sslCert, 'utf8');
    if (topology === 'replicaset' || topology === 'cluster') {
      connectionOptions.replSet.sslCert = fs.readFileSync(sslCert, 'utf8');
    }
    if (topology === 'cluster') {
      connectionOptions.mongos.sslCert = fs.readFileSync(sslCert, 'utf8');
    }
  }
  if (sslKey) {
    connectionOptions.server.sslKey = fs.readFileSync(sslKey, 'utf8');
    if (topology === 'replicaset' || topology === 'cluster') {
      connectionOptions.replSet.sslKey = fs.readFileSync(sslKey, 'utf8');
    }
    if (topology === 'cluster') {
      connectionOptions.mongos.sslKey = fs.readFileSync(sslKey, 'utf8');
    }
  }
  if (sslPass) {
    connectionOptions.server.sslPass = sslPass;
    if (topology === 'replicaset' || topology === 'cluster') {
      connectionOptions.replSet.sslPass = sslPass;
    }
    if (topology === 'cluster') {
      connectionOptions.mongos.sslPass = sslPass;
    }
  }

  return connectionOptions;
};

var verifyNoUserPassFailure = function(port, authMechanism, callback) {
  var url = format('mongodb://localhost:%s/test?authSource=admin', port);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err) {
      assert(err, 'No error on insert with no authorization');
      callback(null);
    });
  });
};

var verifyBadUserPassFailure = function(port, authMechanism, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/test?authSource=admin',
    username, password, port);
  mongodb.MongoClient.connect(url, function(err) {
    assert(err, 'No error on connect with bad credentials');
    callback(null);
  });
};

var verifyWrongDBUserPassFailure = function(port, authMechanism, authSource, dbName, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/%s?authSource=%s',
    username, password, port, dbName, authSource);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err) {
      assert(err, 'No error on insert with bad credentials for collection');
      callback(null);
    });
  });
};

var verifyCannotConnectToDBUserPassFailure = function(port, authMechanism, authSource, dbName, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/%s?authSource=%s',
    username, password, port, dbName, authSource);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert(err, 'No error on connection to wrong db');
    callback(null);
  });
};

var verifyUserPassSuccess = function(port, authMechanism, authSource, dbName, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/%s?authSource=%s',
    username, password, port, dbName, authSource);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err) {
      assert.ifError(err);
      callback(null);
    });
  });
};

var verifyWrongMechanismFailure = function(port, authMechanism, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/test?authSource=admin&authMechanism=%s',
    username, password, port, authMechanism);
  mongodb.MongoClient.connect(url, function(err) {
    assert(err, 'No error on connect with wrong auth mechanism');
    callback(null);
  });
};

var verifySSLSuccess = function(port, topology, sslCAFile, sslPEMKeyFile,
  PEMKeyPassword, sslValidate, callback) {
  var url = format('mongodb://localhost:%s/test?ssl=true', port);
  var connectionOptions = createSSLOptions(topology, sslCAFile, sslPEMKeyFile, sslPEMKeyFile,
    PEMKeyPassword, sslValidate);

  mongodb.MongoClient.connect(url, connectionOptions, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err, result) {
      assert.ifError(err);
      callback(null);
    });
  });
};

var verifySSLFailure = function(port, topology, sslCAFile, sslPEMKeyFile,
  PEMKeyPassword, sslValidate, callback) {
  var url = format('mongodb://localhost:%s/test?ssl=true', port);
  var connectionOptions = createSSLOptions(topology, sslCAFile, sslPEMKeyFile,
    sslPEMKeyFile, PEMKeyPassword, sslValidate);

  mongodb.MongoClient.connect(url, connectionOptions, function(err, db) {
    assert(err, 'No error on connect with wrong ssl parameters.');
    callback(null);
  });
};

module.exports = {
  verifyNoUserPassFailure: verifyNoUserPassFailure,
  verifyBadUserPassFailure: verifyBadUserPassFailure,
  verifyWrongDBUserPassFailure: verifyWrongDBUserPassFailure,
  verifyUserPassSuccess: verifyUserPassSuccess,
  verifyWrongMechanismFailure: verifyWrongMechanismFailure,
  verifyCannotConnectToDBUserPassFailure: verifyCannotConnectToDBUserPassFailure,
  verifySSLSuccess: verifySSLSuccess,
  verifySSLFailure: verifySSLFailure
};
