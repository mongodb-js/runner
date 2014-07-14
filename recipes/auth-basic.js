var path = require('path'),
  runner = require('../');

module.exports = function(opts, done){
  opts = {
    dbpath: '~/.mongodb/data/auth-basic',
    port: 27001,
    keyFile: path.resolve(__dirname + '/../keys/1')
  };

  // Start it up first
  // @todo rm -rf opts.dbpath
  var mongod = runner({dbpath: opts.dbpath, port: opts.port}, function(err){
    if(err) return done(err);

    // Create the initial user
    runner.shell({port: opts.port}, "db.getMongo().getDB('admin').createUser(" +
      "{user: 'root', pwd: 'password', roles: ['root']});", function(err){
      if(err) return done(err);

      // Kill it and restart with auth enabled
      mongod.stop();
      mongod = runner(opts, function(err){
        done(err);
      });
    });
  });
};
