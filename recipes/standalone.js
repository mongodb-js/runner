var bin = require('../lib').bin;

module.exports = function(opts, fn){
  return bin.mongod(opts, fn);
};
