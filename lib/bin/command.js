var bin = require('./'),
  assert = require('assert');

module.exports = Command;
/**
 * @todo: .toYAML() for generating config files from DSL.
 *
 * @param {String} binaryName `mongo|mongos|mongod`
 */
function Command(binaryName){
  assert(bin[binaryName], 'Unknown binary `'+binaryName+'`');
  this.parts = [bin('mongod')];
}

Command.prototype.option = function(name, val){
  if(val === undefined) return this;

  if(Array.isArray(val)){
    val.map(this.option.bind(this, name));
    return this;
  }
  if(val === true){
    this.parts.push.apply(this.parts, ['--' + name]);
  }
  else {
    this.parts.push.apply(this.parts, ['--' + name, val]);
  }
  return this;
};

Command.prototype.argc = function(val){
  if(val === undefined) return this;
  this.parts.push(val);
  return this;
};

Command.prototype.toString = function(){
  return this.parts.join(' ');
};
