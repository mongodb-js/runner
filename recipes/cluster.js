var util = require('util'),
  Recipe = require('./recipe'),
  killall = require('../').killall;

module.exports = Cluster;

function Cluster(opts, fn){
  if (!(this instanceof Cluster)) return new Cluster(opts, fn);

  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts.name = opts.name || 'cluster';
  this.db = opts.db || 'clusterco';
  this.collection = opts.collection || 'user';
  this.shards = parseInt((this.shards || 2), 10);
  this.ns = this.db + '.' + this.collection;
  Cluster.super_.call(this, opts, fn);

}
util.inherits(Cluster, Recipe);

// mongodb://localhost:30999
Cluster.prototype.setup = function(){
  var self = this;
  this.shell(
    'var opts = {shards: '+this.shards+', chunkSize: 1, rs: {oplogSize: 10}, name: \''+this.db+'\'};',
    'var st = new ShardingTest(opts);',
    'st.s.getDB(\''+this.db+'\').adminCommand({enableSharding: \''+this.db+'\'});',
    'st.s.getDB(\''+this.db+'\').adminCommand({shardCollection: \''+this.ns+'\', key: {_id: 1 }});',
  function(err){
    if(err) return self.emit('error', err);
    self.emit('readable');
  });
};

Cluster.prototype.teardown = function(){
  var self = this;
  killall(function(err){
    if(err) return self.emit('error', err);
    self.emit('readable');
  });
};
