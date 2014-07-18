var bin = require('./bin'),
  manager = require('./manager'),
  os = require('os'),
  keepup = require('keepup'),
  log = require('mongodb-log'),
  debug = require('debug')('mongodb-runner:shell');

module.exports = function(){
  var args = Array.prototype.slice.call(arguments, 0),
    id = Math.random(),
    done = args.pop(),
    cmd, opts;

  if(Object.prototype.toString.call(args[0]) === '[object Object]'){
    opts = args.shift();
  }

  opts = opts || {};
  opts.port = opts.port || 27017;

  cmd = bin('mongo') + ' localhost:' + opts.port;

  if(opts.username){
    opts.authdb = opts.authdb || 'admin';
    cmd += ' -u ' + opts.username + ' -p ' + opts.password + ' --authenticationDatabase ' + opts.authdb;
  }

  cmd += ' --eval "print(\'turtlepower.\')" --shell';

  args.push('print(\'complete:' + id + '\')');
  args.push('');

  var prog = keepup(cmd),
    script = args.join(os.EOL);

  var fn = function(){
    prog.on('data', function(d){
      var raw = d.toString('utf-8');
      if(raw.indexOf('complete:' + id) > -1) return done();
      var messages = log.parse(raw.split(os.EOL)).filter(function(m){
        return m.message && m.message[0] !== '\t' && !/\d+\,/.test(m.message);
      });
      if(messages.length === 0) return;
      messages.map(function(line){
        // @todo: yes this is duplicated from lib/bin/mongod and should be
        // integrated into mognodb-log.
        var msg = line.message;
        if(msg === '\t added index to empty collection') return;

        if(!line.event){
          if(msg.indexOf('ERROR:') === 0 || msg.indexOf('instance already running?') > -1){
            line.event = {
              name: 'error',
              data: new Error(msg)
            };
          }
          if(msg === 'dbexit: really exiting now'){
            line.event = {
              name: 'exit',
              data: 0
            };
          }
        }
        debug('< ' + line.message);
      });
    });
    debug('> ' + script);
    prog.write(script);
    manager.add(prog);

    process.on('exit', function(){
      prog.stop();
    });
  };

  var tutlepower = function(d){
    if(d.toString('utf-8').indexOf('turtlepower') > -1){
      debug('shell is ready');
      prog.removeListener('data', tutlepower);
      fn(null, prog);
    }
  };
  prog.on('data', tutlepower);
};
