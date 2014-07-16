var path = require('path'),
  shell = require('../').shell,
  standalone = require('./standalone');

module.exports = function(opts, done){
  opts = {
    dbpath: '~/.mongodb/data/auth-basic',
    port: 27001,
    keyFile: path.resolve(__dirname + '/../keys/mongodb-keyfile')
  };

  // Start it up first
  // @todo rm -rf opts.dbpath
  var mongod = standalone({dbpath: opts.dbpath, port: opts.port}, function(err){
    if(err) return done(err);

    // Create the initial user
    shell({port: opts.port}, "db.getMongo().getDB('admin').createUser(" +
      "{user: 'root', pwd: 'password', roles: ['root']});", function(err){
      if(err) return done(err);

      // Kill it and restart with auth enabled
      mongod.stop();
      mongod = standalone(opts, function(err){
        done(err, mongod);
      });
    });
  });
};
