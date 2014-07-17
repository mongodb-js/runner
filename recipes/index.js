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

  var tasks = [],
    names = Object.keys(module.exports).filter(function(n){
      return n !== 'all';
    });

  names.map(function(name){
    tasks.push(function(cb){
      console.log(JSON.stringify({
        name: 'start',
        recipe: name
      }));
      module.exports[name](opts, function(err, res){
        if(err) return cb(err);
          console.log(JSON.stringify({
            name: 'ready',
            uri: res.uri,
            recipe: name
          }));
        cb();
      });
    });
  });

  async.series(tasks, fn);
}

module.exports.all = all;
