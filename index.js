var keepup = require('keepup'),
  path = require('path'),
  bridge = require('mongodb-bridge'),
  log = require('mongodb-log'),
  untildify = require('untildify'),
  os = require('os'),
  mkdirp = require('mkdirp'),
  debug = require('debug')('mongodb-runner'),
  which = require('which'),
  bin = {},
  allPrograms = [];

['mongo', 'mongod', 'mongos'].map(function(program){
  try{
    bin[program] = which.sync(program);
  }
  catch(e){
    console.warn('warning: ' + program + ' does not appear to be installed!');
  }
});

function shell(){
  var args = Array.prototype.slice.call(arguments, 0),
    id = Math.random(),
    done = args.pop(),
    script,
    cmd,
    opts;
  if(Object.prototype.toString.call(args[0]) === '[object Object]'){
    opts = args.shift();
  }

  opts = opts || {};
  opts.port = opts.port || 27017;

  cmd = bin.mongo + ' localhost:' + opts.port;

  if(opts.username){
    cmd += ' -u ' + opts.username + ' -p ' + opts.password + ' --authenticationDatabase admin';
  }
  cmd += ' --eval "print(\'turtlepower.\')" --shell';

  args.push('print(\'complete:' + id + '\')');
  args.push('');
  script = args.join(os.EOL);
  var prog = keepup(cmd);

  var fn = function(){
    prog.on('data', function(d){
      var raw = d.toString('utf-8');
      if(raw.indexOf('complete:' + id) > -1) return done();
      var messages = log.parse(raw.split(os.EOL)).filter(function(m){
        return m.message[0] !== '\t' && !/\d+\,/.test(m.message);
      });
      if(messages.length === 0) return;
      messages.map(function(m){
        debug(m.message);
      });
    });
    debug('running script', script);
    prog.write(script);
    allPrograms.push(prog);

    process.on('exit', function(){
      prog.stop();
    });
  };

  var tutlepower = function(d){
    debug('tutlepower?');
    if(d.toString('utf-8').indexOf('turtlepower') > -1){
      debug('shell is ready.  removing first listener and hitting callback');
      prog.removeListener('data', tutlepower);
      fn(null, prog);
    }
  };
  prog.on('data', tutlepower);
}

module.exports = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  if(!fn) fn = function(){};

  opts = opts || {};
  opts.port = parseInt((opts.port || 27017), 10);
  opts.dbpath = (opts.dbpath || '/data/db/standalone');
  opts.dbpath = path.resolve(untildify(opts.dbpath));

  opts.params = opts.params || {};

  mkdirp.sync(opts.dbpath);

  // bridge({to: 'localhost:' + opts.port});

  var cmd = [bin.mongod, '--port', opts.port, '--dbpath', opts.dbpath];

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
  allPrograms.push(prog);
  return prog;
};

module.exports.shell = shell;

module.exports.bridge = function(opts){
  debug('starting bridge', opts);
  return bridge(opts);
};

module.exports.replicaset = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  if(!fn) fn = function(){};

  opts = opts || {};
  opts.name = opts.name || 'replicom';
  opts.instances = parseInt((opts.instances || 3), 10);
  opts.startPort = parseInt((opts.startPort || 6000), 10);

  debug('starting replicaset', opts);

  shell('var opts = {name: \''+opts.name+'\', nodes: '+opts.instances+', useHostName: false, startPort: '+opts.startPort+'};',
    'var rs = new ReplSetTest(opts);',
    'rs.startSet();', 'rs.initiate();',
    fn);
};

module.exports.cluster = function(opts, fn){
  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }

  if(!fn) fn = function(){};

  opts = opts || {};
  opts.db = opts.db || 'clusterco';
  opts.collection = opts.collection || 'user';
  opts.shards = parseInt((opts.shards || 2), 10);
  opts.ns = opts.db + '.' + opts.collection;

  debug('starting cluster', opts);
  shell(
    'var opts = {shards: '+opts.shards+', chunkSize: 1, rs: {oplogSize: 10}, name: \''+opts.db+'\'};',
    'var st = new ShardingTest(opts);',
    'st.s.getDB(\''+opts.db+'\').adminCommand({enableSharding: \''+opts.db+'\'});',
    'st.s.getDB(\''+opts.db+'\').adminCommand({shardCollection: \''+opts.ns+'\', key: {_id: 1 }});',
  fn);
};

module.exports.listen = function(fn){
  fn = fn || function(){};

  var standalone = module.exports,
    replicaset = module.exports.replicaset,
    cluster = module.exports.cluster;

  standalone(function(err){
    if(err) return fn(err);

    replicaset(function(err){
      if(err) return fn(err);

      cluster(function(err){
        if(err) return fn(err);

        fn();
      });
    });
  });
};

module.exports.close = function(){
  allPrograms.map(function(prog){
    prog.stop();
  });
};

module.exports.recipes = require('./recipes');
