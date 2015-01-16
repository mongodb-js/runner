var bin = require('./bin'),
  manager = require('./manager'),
  os = require('os'),
  keepup = require('keepup'),
  log = require('mongodb-log'),
  EJSON = require('mongodb-extended-json'),
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
  debug('running command to open shell: `%s`', cmd);


  var error,
    prog = keepup(cmd)
    .on('crash', function(code){
      debug('shell exited with code %s', code);
      if(code !== 0){
        return done(new Error(error));
      }
    })
    .on('stderr', function(buf){
      error = buf.toString('utf-8');
      if(error && error.length > 2){
        debug('set error to: `%s`', error);
      }
    }),
    script = args.join(os.EOL);

  var shellReady = function(){
    var res;
    prog.on('data', function(d){
      var raw = d.toString('utf-8');

      var dateRegExp = /ISODate\(\"([\w\d\-\:]+)\"\)/g;
      var dateMatches;
      var timestampRegExp = /Timestamp\((\d+)\,\s?(\d+)\)/;
      var timestampMatches;
      var data;

      while ((dateMatches = dateRegExp.exec(raw)) !== null){
        raw = raw.replace(dateMatches[0], '{"$date": '+new Date(dateMatches[1]).getTime()+'}');
      }
      while ((timestampMatches = timestampRegExp.exec(raw)) !== null){
        raw = raw.replace(timestampMatches[0], '{"$timestamp": {"$t": '+ timestampMatches[1] +', "$i": '+timestampMatches[2]+'}}');
      }

      try{
        data = EJSON.parse(raw);
      }
      catch(e){
      }

      if(data) {
        res = data;
      }

      if(raw.indexOf('complete:' + id) > -1){
        return done(null, res);
      }

      var messages = log.parse(raw.split(os.EOL)).filter(function(m){
        return m.message && m.message[0] !== '\t' && !/\d+\,/.test(m.message);
      });
      if(messages.length === 0) return;
      messages.map(function(line){
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
      shellReady(null, prog);
    }
  };
  prog.on('data', tutlepower);
};
