var shell = require('../lib').shell,
  options = require('../lib').options,
  util = require('util'),
  async = require('async'),
  EventEmitter = require('events').EventEmitter,
  _ = require('underscore'),
  debug = require('debug')('mongodb-runner:recipe');

module.exports = Recipe;

function Options(defaults){
  this._data = defaults || {};

  _.defaults(this._data, {
    port: defaults.port || 27017,
    keyfile: defaults.keyfile || undefined,
    name: defaults.name || 'mongodb',
    dbpath: undefined
  });

  var self = this;
  var tasks = [];
  if(this.get('dbpath') === undefined) {
    tasks.push(function(cb){
      options.dbpath(self.get('name'), function(err, p){
        if(err) return cb(err);
        self.set('dbpath', p);
        debug('resolved dbpath');
        cb();
      });
    });
  } else {
    tasks.push(function(cb){
      options.dbpath(self.get('dbpath'), function(err, p){
        if(err) return cb(err);
        debug('resolved dbpath');
        cb();
      });
    });
  }

  if(this.get('keyfile') !== undefined){
    tasks.push(function(cb){
      debug('resolved keyfile');
      options.keyfile(self.get('keyfile'), cb);
    });
  }

  async.parallel(tasks, function(err){
    if(err) return self.emit('error');
    self.emit('readable');
  });
}
util.inherits(Options, EventEmitter);

Options.prototype.get = function(k){
  return this._data[k];
};

Options.prototype.set = function(k, v){
  this._data[k] = v;
  return this;
};

Options.prototype.toJSON = function(){
  return this._data;
};

function Recipe(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  Recipe.super_.call(this);

  this.debug = require('debug')('mongodb-runner:' + opts.name);

  this.on('error', fn);
  this.on('readable', function(){
    fn(null, this.options.toJSON());
  }.bind(this));

  this.options = new Options(opts)
    .on('readable', this.setup.bind(this));
}
util.inherits(Recipe, EventEmitter);

Recipe.prototype.shell = function(script, fn){
  var opts = {
    port: this.options.get('port'),
    dbpath: this.options.get('dbpath') + '-shell'
  };
  shell(opts, script, fn);
};

Recipe.prototype.setup = function(){
  this.emit('readable');
};

Recipe.prototype.teardown = function(){
  this.emit('end');
};
