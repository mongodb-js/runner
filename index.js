var bridge = require('mongodb-bridge'),
  recipes = require('./recipes'),
  manager = require('./lib').manager;

module.exports = function(name, fn){
  name = name || process.env.RUNNER_RECIPE || 'all';
  if(!recipes[name]){
    return fn(new Error('Unknown recipe `'+name+'`'));
  }
  recipes[name]({}, function(err, res){
    if(err) return fn(err);

    res = res || {};
    res.recipe = name;

    console.log(JSON.stringify({
      name: 'ready',
      uri: res.uri,
      recipe: res.recipe
    }));

    fn(null, res);
  });
};

module.exports.bridge = function(opts){
  debug('starting bridge', opts);
  return bridge(opts);
};

module.exports.close = function(){
  manager.list(function(err, programs){
    programs.map(function(prog){
      prog.stop();
    });
  });
};
