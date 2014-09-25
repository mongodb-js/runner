var bridge = require('mongodb-bridge'),
  recipes = require('./recipes'),
  manager = require('./lib').manager,
  exec = require('child_process').exec,
  async = require('async'),
  windows = require('os').platform() === 'win32';

module.exports = function(name, fn){
  name = name || process.env.RUNNER_RECIPE || 'all';
  if(!recipes[name]){
    return fn(new Error('Unknown recipe `'+name+'`'));
  }
  return recipes[name]({}, function(err, res){
    if(err) return fn(err);

    res = res || {};
    res.recipe = name;

    fn(null, res);
  });
};

module.exports.shell = require('./lib').shell;

module.exports.bridge = function(opts){
  return bridge(opts);
};

module.exports.close = function(){
  manager.list(function(err, programs){
    programs.map(function(prog){
      prog.stop();
    });
  });
};

module.exports.killall = function(done){
  async.parallel(['mongod', 'mongo', 'mongos'].map(function(name){
    var cmd = (windows) ? 'taskkill /F /IM '+name+'.exe' : 'killall -9 ' + name;
    return exec.bind(null, cmd);
  }), done);
};
