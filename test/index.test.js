var run = require('../');

describe('run', function(){
  it('should start a standalone', function(done){
    var prog = run('standalone', function(err){
      if(err) return done(err);
      prog.teardown();
    })
    .on('end', done);
  });

  it('should start with auth', function(done){
    var prog = run('auth-basic', function(err){
      if(err) return done(err);
      prog.teardown();
    })
    .on('end', done);
  });

  it('should start a replica set', function(done){
    var prog = run('replicaset', function(err){
      if(err) return done(err);
      prog.teardown();
    })
    .on('end', done);
  });

  it.skip('should start a cluster', function(done){
    run('cluster', done);
  });
});
