var assert = require('assert'),
  runner = require('./');

describe('runner', function(){
  it('should start a standalone', function(done){
    runner(done);
  });

  it('should start a replica set', function(done){
    runner.replicaset(done);
  });

  it('should start a cluster', function(done){
    runner.cluster(done);
  });
});
