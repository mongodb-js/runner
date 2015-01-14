var bin = require('../lib').bin,
  Recipe = require('./recipe'),
  util = require('util'),
  fs = require('fs-extra'),
  os = require('os'),
  assert = require('assert');

module.exports = ReplicaSet;

function ReplicaSet(opts, fn){
  if (!(this instanceof ReplicaSet)) return new ReplicaSet(opts, fn);

  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts.name = opts.name || 'replicom';
  opts.port = opts.port || 27700;
  opts.instances = opts.instances || 1;
  opts.replSet = opts.name;
  opts.hostname = os.hostname();
  opts.uri = 'mongodb://' + opts.hostname + ':' + opts.port;

  ReplicaSet.super_.call(this, opts, fn);
}
util.inherits(ReplicaSet, Recipe);

// ReplicaSet.prototype.setup = function(){
//   var opts = {
//     name: this.options.get('name'),
//     dbpath: this.options.get('dbpath'),
//     port: this.options.get('port'),
//     instances: this.options.get('instances')
//   };

//   debug('preparing %j', opts);
//   var code = [
//     'var opts = {name: \''+opts.name+'\', nodes: '+opts.instances+', useHostName: false, startPort: '+opts.port+'};',
//     'var rs = new ReplSetTest(opts);',
//     'rs.startSet();', 'rs.initiate();',
//     ].join('\n');
//   this.shell(code, function(err){
//     if(err) return this.emit('error', err);
//     this.emit('readable');
//   }.bind(this));
// };

ReplicaSet.prototype.setup = function(){
  assert(this.options.get('replSet'), 'replSet option required');
  this.debug('starting mongod with options %j', this.options);
  this.mongod = bin.mongod(this.options.toJSON(), function(err){
    if(err) return this.emit('error', err);

    this.debug('initiating replicaset');
    console.log('RUNNING rs.initiate');
    this.shell('rs.initiate(\''+this.options.get('hostname')+':'+this.options.get('port')+'\');', function(err){
      if(err) return this.emit('error', err);
      // @todo: wait for "database writes are now permitted" to show up in logs
    }.bind(this));
  }.bind(this))
  .on('readable', this.emit.bind(this, 'readable'));
};

ReplicaSet.prototype.teardown = function(){
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
