// @todo: Harvest for more recipes:
// https://github.com/10gen/QA/tree/master/vagrant
var async = require('async');

module.exports = {
  'auth-basic': require('./auth-basic'),
  standalone: require('./standalone'),
  replicaset: require('./replicaset'),
  cluster: require('./cluster'),
};

function all(opts, fn){
  opts = opts || {};
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  var tasks = [];
  Object.keys(module.exports).map(function(name){
    tasks.push(function(cb){
      module.exports[name](opts, cb);
    });
  });

  async.series(tasks, fn);
}

module.exports.all = all;
