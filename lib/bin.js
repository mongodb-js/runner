var which = require('which'),
  bin = {};

module.exports = function(program){
  if(!bin[program]){
    throw new Error(program + ' is not installed.');
  }
  return bin[program];
};

['mongo', 'mongod', 'mongos'].map(function(program){
  try{
    bin[program] = which.sync(program);
  }
  catch(e){
    console.warn('warning: ' + program + ' does not appear to be installed!');
  }
});
