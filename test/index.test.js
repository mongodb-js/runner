var run = require('../'),
  assert = require('assert');

describe('runner', function(){
  it('should start a standalone', function(done){
    run('standalone', done);
  });

  it('should start a standalone with auth', function(done){
    run('auth-basic', function(err, prog){
      assert.ifError(err);
      assert(prog);
      prog.stop();
      done();
    });
  });

  it('should start a replica set', function(done){
    run('replicaset', done);
  });

  it('should start a cluster', function(done){
    run('cluster', done);
  });
});
