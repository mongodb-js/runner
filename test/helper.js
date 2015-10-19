var assert = require('assert');
var mongodb = require('mongodb');
var format = require('util').format;


var verifyNoUserPassFailure = function(port, authMechanism, callback) {
  var url = format('mongodb://localhost:%s/test?authSource=admin&authMechanism=%s',
    port, authMechanism);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err2) {
      assert(err2, 'No error on insert with no authorization');
      callback(null);
    });
  });
};

var verifyBadUserPassFailure = function(port, authMechanism, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/test?authSource=admin&authMechanism=%s',
    username, password, port, authMechanism);
  mongodb.MongoClient.connect(url, function(err) {
    assert(err, 'No error on connect with bad credentials');
    callback(null);
  });
};

var verifyWrongDBUserPassFailure = function(port, authMechanism, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/admin?authSource=admin&authMechanism=%s',
    username, password, port, authMechanism);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err2) {
      assert(err2, 'No error on insert with bad credentials for collection');
      callback(null);
    });
  });
};

var verifyUserPassSuccess = function(port, authMechanism, username, password, callback) {
  var url = format('mongodb://%s:%s@localhost:%s/test?authSource=admin&authMechanism=%s',
    username, password, port, authMechanism);
  mongodb.MongoClient.connect(url, function(err, db) {
    assert.ifError(err);
    db.collection('fruit').insertOne({
      variety: 'apple'
    }, function(err2) {
      assert.ifError(err2);
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

module.exports = {
  verifyNoUserPassFailure: verifyNoUserPassFailure,
  verifyBadUserPassFailure: verifyBadUserPassFailure,
  verifyWrongDBUserPassFailure: verifyWrongDBUserPassFailure,
  verifyUserPassSuccess: verifyUserPassSuccess,
  verifyWrongMechanismFailure: verifyWrongMechanismFailure
};
