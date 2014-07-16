var bin = require('../').bin;

module.exports = function(opts, fn){
  return bin.mongod(opts, fn);
};
