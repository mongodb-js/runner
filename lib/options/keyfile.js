var fs = require('fs');

module.exports = function(src, fn){
  if(!src) return fn();
  fs.chmod(src, '600', fn);
};
