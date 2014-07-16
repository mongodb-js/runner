var debug = require('debug')('mongodb-runner:replicaset'),
  shell = require('../').shell;

module.exports = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  if(!fn) fn = function(){};

  opts = opts || {};
  opts.name = opts.name || 'replicom';
  opts.instances = parseInt((opts.instances || 3), 10);
  opts.startPort = parseInt((opts.startPort || 6000), 10);

  debug('starting replicaset', opts);

  shell('var opts = {name: \''+opts.name+'\', nodes: '+opts.instances+', useHostName: false, startPort: '+opts.startPort+'};',
    'var rs = new ReplSetTest(opts);',
    'rs.startSet();', 'rs.initiate();',
    fn);
};
