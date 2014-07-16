var all = [];

module.exports.add = function(program){
  all.push(program);
  return module.exports;
};

module.exports.list = function(fn){
  fn(null, all);
  return module.exports;
};
