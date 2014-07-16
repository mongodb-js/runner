var debug = require('debug')('mongodb-runner:standalone'),
  shell = require('../').shell,
  manager = require('../').manager,
  bin = require('../').bin,
  mkdirp = require('mkdirp'),
  keepup = require('keepup'),
  path = require('path'),
  untildify = require('untildify'),
  log = require('mongodb-log');

module.exports = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  if(!fn) fn = function(){};

  opts = opts || {};
  opts.port = parseInt((opts.port || 27017), 10);
  opts.dbpath = path.resolve(untildify((opts.dbpath || '/data/db/standalone')));

  opts.params = opts.params || {};

  mkdirp.sync(opts.dbpath);

  var cmd = [bin('mongod'), '--port', opts.port, '--dbpath', opts.dbpath];

  if(opts.keyFile){
    cmd.push.apply(cmd, ['--keyFile', opts.keyFile]);
  }
  Object.keys(opts.params).map(function(k){
    cmd.push.apply(cmd, ['--setParameter', k + '=' + opts.params[k]]);
  });

  cmd = cmd.join(' ');
  debug('starting standalone', cmd);

  var _d = require('debug')('mongod:' + opts.port);
  var prog = keepup(cmd).on('ready', function(){
      fn(null, prog);
    })
    .on('error', function(err){
      console.error(err);
    })
    .on('data', function(buf){
      var messages = log.parse(buf.toString().split('\n'));
      messages.filter(function(msg){
        _d(msg.message);
        return msg.event !== null;
      }).map(function(msg){
        return msg.event;
      }).forEach(function(evt){
        if(evt.name === 'ready'){
          prog.emit(evt.name, evt.data);
        }
      });
    });
  manager.add(prog);
  return prog;
};
