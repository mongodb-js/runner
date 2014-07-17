var run = require('../'),
  fs = require('fs-extra'),
  path = require('path'),
  assert = require('assert');

describe('Regressions', function(){
  before(function(){
    var keyFile = path.resolve(__dirname + '/../keys/mongodb-keyfile');
    fs.chmodSync(keyFile, '644');
  });

  it('should chmod the keyfile to the correct perms if used', function(done){
    run('auth-basic', function(err, prog){
      if(err) return done(err);
      assert(prog);
      prog.stop();
      done();
    });
  });
});
