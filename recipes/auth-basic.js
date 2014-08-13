var path = require('path'),
  shell = require('../lib/').shell,
  Options = require('../lib/').Options,
  fs = require('fs-extra'),
  standalone = require('./standalone'),
  mvm = require('mongodb-version-manager'),
  util = require('util'),
  assert = require('assert'),
  EventEmitter = require('events').EventEmitter,
  debug = require('debug')('mongodb-runner:recipe:auth-basic');

module.exports = AuthBasic;
function AuthBasic(opts, fn){
  if (!(this instanceof AuthBasic)) return new AuthBasic(opts, fn);

  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  AuthBasic.super_.call(this);

  this.on('error', fn);
  this.on('readable', fn.bind(null));

  this.options = new Options(this, {
    port: 27001,
    keyFile: path.resolve(__dirname + '/../keys/mongodb-keyfile')
  });

  this.options.on('readable', this.setup.bind(this));
}
util.inherits(AuthBasic, EventEmitter);

AuthBasic.prototype.mongod = null;

AuthBasic.prototype.name = 'auth-basic';

AuthBasic.prototype.shell = function(script, fn){
  var opts = {
    port: this.options.get('port'),
    dbpath: this.options.get('dbpath') + '-shell'
  };
  shell(opts, script, fn);
};

AuthBasic.prototype.setup = function(){
  var opts = {
    name: 'setup|' + this.name,
    clear: true,
    dbpath: this.options.get('dbpath'),
    port: this.options.get('port')
  };

  assert(this.options.get('dbpath'), 'wtf: dbpath option is ' + JSON.stringify(this.options.get('dbpath')));

  debug('preparing %j', opts);
  this.mongod = standalone(opts, function(err){
    if(err) return this.emit('error', err);

    debug('create the initial root user');

    // @todo: move to shell.createUser
    mvm.is('< 2.6.x', function(err, hasNewAuth){
      var method = hasNewAuth ? 'createUser' : 'addUser';
      this.shell("db.getMongo().getDB('admin')."+method+"(" +
        "{user: 'root', pwd: 'password', roles: ['root']});", function(err){
        if(err) return this.emit('error', err);

        debug('restarting to enable auth');
        this.mongod.stop(function(){
          this.mongod = standalone({
            dbpath: opts.dbpath,
            port: opts.port,
            name: this.name,
            keyFile: path.resolve(__dirname + '/../keys/mongodb-keyfile')
          }, function(err){
            if(err) return this.emit('error', err);
            this.emit('readable');
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

AuthBasic.prototype.teardown = function(){
  this.mongod.stop(function(){
    fs.remove(this.options.get('dbpath'), function(err){
      if(err) return this.emit('error', err);

      this.emit('end');
    });
  }.bind(this));
};
