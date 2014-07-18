var path = require('path'),
  shell = require('../lib/').shell,
  standalone = require('./standalone'),
  debug = require('debug')('mongodb-runner:recipe:auth-basic');

module.exports = function(opts, done){
  opts = {
    name: 'auth-basic:27001',
    dbpath: '/data/db/auth-basic',
    port: 27001,
    keyFile: path.resolve(__dirname + '/../keys/mongodb-keyfile')
  };

  debug('start one time to clear old data');
  var mongod = standalone({
      name: 'setup|' + opts.name,
      clear: true,
      dbpath: opts.dbpath,
      port: opts.port
    }, function(err){
    if(err) return done(err);

    debug('create the initial root user');
    shell({port: opts.port}, "db.getMongo().getDB('admin').createUser(" +
      "{user: 'root', pwd: 'password', roles: ['root']});", function(err){
      if(err) return done(err);

      debug('restarting to enable auth');
      mongod.stop(function(){
        mongod = standalone(opts, function(err){
          done(err, mongod);
        });
      });
    });
  });
};
