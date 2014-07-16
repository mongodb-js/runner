var debug = require('debug')('mongodb-runner:cluster'),
  shell = require('../lib/shell');

module.exports = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts = opts || {};
  opts.db = opts.db || 'clusterco';
  opts.collection = opts.collection || 'user';
  opts.shards = parseInt((opts.shards || 2), 10);
  opts.ns = opts.db + '.' + opts.collection;

  debug('starting cluster', opts);
  shell(
    'var opts = {shards: '+opts.shards+', chunkSize: 1, rs: {oplogSize: 10}, name: \''+opts.db+'\'};',
    'var st = new ShardingTest(opts);',
    'st.s.getDB(\''+opts.db+'\').adminCommand({enableSharding: \''+opts.db+'\'});',
    'st.s.getDB(\''+opts.db+'\').adminCommand({shardCollection: \''+opts.ns+'\', key: {_id: 1 }});',
  function(err){
    if(err) return fn(err);

    opts.uri = 'mongodb://localhost:30999';

    fn(null, opts);
  });
};
