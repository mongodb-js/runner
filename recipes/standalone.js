var bin = require('../lib').bin;
var util = require('util'),
  Recipe = require('./recipe'),
  fs = require('fs-extra');

module.exports = Standalone;

function Standalone(opts, fn){
  if (!(this instanceof Standalone)) return new Standalone(opts, fn);

  opts.port = opts.port || 27017;
  opts.name = opts.name || 'standalone';
  Standalone.super_.call(this, opts, fn);
}
util.inherits(Standalone, Recipe);

Standalone.prototype.setup = function(){
  this.debug('starting mongod', this.options.toJSON());
  var self = this;
  this.mongod = bin.mongod(this.options.toJSON(), function(err){
    if(err) return self.emit('error', err);
    self.emit('readable');
  });
};

Standalone.prototype.teardown = function(){
  this.debug('stopping mongod');
  var self = this;
  this.mongod.stop(function(){
    self.debug('remove dbpath', self.options.get('dbpath'));
    fs.remove(self.options.get('dbpath'), function(err){
      if(err) return self.emit('error', err);
      self.emit('end');
    });
  });
};
