var bridge = require('mongodb-bridge');

module.exports.bin = require('./lib/bin');
module.exports.shell = require('./lib/shell');
module.exports.manager = require('./lib/manager');

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

module.exports.recipes = require('./recipes');
