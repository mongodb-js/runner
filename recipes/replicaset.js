var debug = require('debug')('mongodb-runner:replicaset'),
  shell = require('../lib/shell');

module.exports = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  opts = opts || {};
  opts.rs = opts.rs || 'replicom';
  opts.instances = parseInt((opts.instances || 3), 10);
  opts.startPort = parseInt((opts.startPort || 6000), 10);

  var hosts = [];
  for(var i = 0; i < opts.instances; i++){
    var port = opts.startPort + i;
    hosts.push('localhost:'+port);
  }

  debug('starting replicaset', opts);

  shell('var opts = {name: \''+opts.rs+'\', nodes: '+opts.instances+', useHostName: false, startPort: '+opts.startPort+'};',
    'var rs = new ReplSetTest(opts);',
    'rs.startSet();', 'rs.initiate();',
    function(err){
      if(err) return fn(err);

      fn(null, {
        uri: 'mongodb://'+hosts.join(',')+'?replicaSet=' + opts.rs
      });
    });
};
