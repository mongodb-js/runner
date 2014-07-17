var run = require('../');

describe('runner', function(){
  it('should start a standalone', function(done){
    run('standalone', done);
  });

  it('should start a standalone with auth', function(done){
    run('auth-basic', done);
  });

  it('should start a replica set', function(done){
    run('replicaset', done);
  });

  it('should start a cluster', function(done){
    run('cluster', done);
  });
});
