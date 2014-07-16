var bridge = require('mongodb-bridge');

module.exports = require('./lib');
module.exports.recipes = require('./recipes');

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
