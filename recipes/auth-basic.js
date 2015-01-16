var path = require('path'),
  bin = require('../lib').bin,
  Standalone = require('./standalone'),
  mvm = require('mongodb-version-manager'),
  util = require('util'),
  debug = require('debug')('mongodb-runner:recipe:auth-basic');

module.exports = AuthBasic;
function AuthBasic(opts, fn){
  if (!(this instanceof AuthBasic)) return new AuthBasic(opts, fn);

  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts.name = opts.name || 'auth-basic';
  opts.port = opts.port || 27001;
  opts.keyfile = opts.keyfile || path.resolve(__dirname + '/../keys/mongodb-keyfile');
  AuthBasic.super_.call(this, opts, fn);
}
util.inherits(AuthBasic, Standalone);

AuthBasic.prototype.setup = function(){
  var self = this,
    opts = this.options.toJSON();

  delete opts.keyFile;

  debug('preparing %j', opts);
  this.mongod = bin.mongod(opts, function(err){
    if(err) return self.emit('error', err);

    debug('create the initial root user');
    mvm.is('< 2.6.x', function(err, hasOldAuth){
      debug('has 2.4 auth?', hasOldAuth);
      var method = hasOldAuth ? 'addUser' : 'createUser';
      self.shell("db.getMongo().getDB('admin')."+method+"(" +
        "{user: 'root', pwd: 'password', roles: ['root']});", function(err){
        if(err) return self.emit('error', err);

        debug('restarting to enable auth');
        self.mongod.stop(function(){
          self.mongod = bin.mongod(self.options.toJSON(), function(err){
            if(err) return self.emit('error', err);
            self.emit('readable');
          });
        });
      });
    });
  });
};
