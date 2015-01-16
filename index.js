var bridge = require('mongodb-bridge'),
  recipes = require('./recipes'),
  manager = require('./lib').manager,
  exec = require('child_process').exec,
  async = require('async'),
  windows = require('os').platform() === 'win32',
  debug = require('debug')('mongodb-runner');

module.exports = function(name, opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  name = name || process.env.RUNNER_RECIPE || 'all';

  if(!recipes[name]){
    return fn(new Error('Unknown recipe `'+name+'`'));
  }

  debug('starting recipe %s', name);
  var prog = recipes[name](opts, function(err, res){
    if(err) return fn(err);

    res = res || {};
    res.recipe = name;

    debug('recipe %s is up', name);

    fn(null, res);
  });
  prog.on('end', function(){
    debug('recipe %s complete', name);
  });
return prog;
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
  debug('killing any mongod, mongo, or mongos processes');
  async.parallel(['mongod', 'mongo', 'mongos'].map(function(name){
    var cmd = (windows) ? 'taskkill /F /IM '+name+'.exe' : 'killall -9 ' + name;
    return exec.bind(null, cmd);
  }), done);
};
