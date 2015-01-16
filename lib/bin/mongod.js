var manager = require('../manager'),
  keepup = require('keepup'),
  path = require('path'),
  untildify = require('untildify'),
  log = require('mongodb-log'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  Command = require('./command'),
  exec = require('child_process').exec;

function MongoD(opts){
  opts.port = parseInt((opts.port || 27017), 10);
  opts.name = opts.name || '' + opts.port;
  opts.dbpath = path.resolve(untildify((opts.dbpath)));
  opts.params = opts.params || {};
  opts.clear = opts.clear || false;

  this.command = new Command('mongod')
    .option('port', opts.port)
    .option('dbpath', opts.dbpath)
    .option('keyFile', opts.keyFile)
    .option('setParameter', Object.keys(opts.params).map(function(k){
      return k + '=' + opts.params[k];
    }));

  // replicaset options
  if(opts.replSet){
    this.command.option('replSet', opts.replSet);
  }

  // @todo: cluster member options

  this.options = opts;
  this.debug = require('debug')('mongodb-runner:mongod:' + opts.name);

  this.readable = false;
  this.lifecycle = {
    startup: [],
    shutdown: [],
    threads: {
      'initandlisten': 'startup',
      'FileAllocator': 'startup',
      'signalProcessingThread': 'shutdown',
      'rsStart': 'replication',
      'rsMgr': 'replication',
      'rsSync': 'replication'
    }
  };

  this.uri = 'mongodb://localhost:' + opts.port;
  this.program = keepup(this.command.toString()).on('data', this.onData.bind(this));

  this.on('ready', this.onReady.bind(this))
    .on('lifecycle', function(name, previous){
      this.debug('lifecycle transitioning from %s -> %s', previous, name);
      if(name === 'shutdown' && previous === 'fatal'){
        this.emit('error', new Error(this.lifecycle[previous].map(function(line){return line.message;}).join(' ')));
      }
    }.bind(this))
    .on('exit', function(){

      this.lifecycle.unknown = this.lifecycle.unknown || [];
      this.debug('Unknown lifecycle for %d log events', this.lifecycle.unknown.length);
      this._dumpLifecycleMessages('unknown');

      this._dumpLifecycleMessages('shutdown');
    }.bind(this));

  manager.add(this.program);
}
util.inherits(MongoD, EventEmitter);

MongoD.prototype.onReady = function(){
  this.readable = true;
};

MongoD.prototype.onShutdownMissed = function(){
  throw new Error('No exit event within 3000ms of calling stop.  '+
    'Something is horribly wrong.');
};

MongoD.prototype.onExit = function(fn, code){
  clearTimeout(this.shutdownTimer);
  this.debug('goodbye %j', {code: code});
  if(fn) fn();
};

MongoD.prototype.stop = function(fn){
  fn = fn || function(){};
  this.shutdownTimer = setTimeout(this.onShutdownMissed, 3000);
  this.once('exit', this.onExit.bind(this, fn));
  this.program.stop();
  return this;
};

MongoD.prototype.onData = function(buf){
  log.parse(buf.toString().split('\n')).map(this.inspectLogLine.bind(this));
  this.emit('data', buf);
};
MongoD.prototype.lifecycle_debug = {};
MongoD.prototype._dumpLifecycleMessages = function(lifecycle){
  if(!this.lifecycle[lifecycle]) return;

  this.lifecycle[lifecycle].map(this._debugLifecycle.bind(this, lifecycle));
  this.lifecycle[lifecycle] = [];
};

MongoD.prototype._debugLifecycle = function(lifecycle, line){
  if(!this.lifecycle_debug[lifecycle]){
    this.lifecycle_debug[lifecycle] = require('debug')('mongodb-runner:mongod:' + this.options.name + ':' + lifecycle);
  }
  if(lifecycle === 'unknown'){
    this.lifecycle_debug[lifecycle](line.line);
  }
  else {
    this.lifecycle_debug[lifecycle](line.message);
  }
};

MongoD.prototype._injectExtraLogEvents = function(line){
  if(!line.event && line.message){
    if(line.message.indexOf('ERROR:') === 0 || line.message.indexOf('instance already running?') > -1){
      line.event = {
        name: 'error',
        data: new Error(line.msg)
      };
    }
    else if(line.message.indexOf('really exiting now') > -1){
      line.event = {
        name: 'exit',
        data: 0
      };
    }
    else if(line.message.indexOf('replSet PRIMARY') > -1){
      line.event = {
        name: 'readable'
      };
    }
  }
};
MongoD.prototype._currentLifecycle = null;

MongoD.prototype.inspectLogLine = function(line){
  // console.log('LOG: %j', line);
  this._injectExtraLogEvents(line);

  if(line.message && line.message.indexOf('\t') === 0){
    var stack = this.lifecycle[this._currentLifecycle];
    this.lifecycle[this._currentLifecycle][stack.length - 1].message += line.message.replace('\t ', '');
    return;
  }

  var lifecycle = this.lifecycle.threads[line.thread];
  if(line.message){
    if(line.message.indexOf('replSet') === 0){
      lifecycle = 'replication';
    }
    if(line.message.indexOf('build index on: local.system.replset') === 0){
      lifecycle = 'replication';
    }
    if(line.message.indexOf('command admin.$cmd command: replSetInitiate') === 0){
      lifecycle = 'replication';
    }
    if(line.message.indexOf('creating replication oplog') === 0){
      lifecycle = 'replication';
    }
    if(lifecycle === 'replication'){
      line.message = line.message.replace('replSet ', '');
    }
  }
  if(line.message === '****'){
    lifecycle = 'fatal';
  }

  if(line.message === 'cannot do this upgrade without an upgrade in the middle'){
    lifecycle = 'fatal';
  }

  if(line.message === 'please do a --repair with 2.6 and then start this version'){
    lifecycle = 'fatal';
  }

  if(lifecycle){
    if(lifecycle === 'startup' && (line.message.indexOf('shutdown') === 0 || line.message.indexOf('dbexit') === 0 || line.message.indexOf('closeAllFiles') === 0 || line.message.indexOf('journalCleanup') === 0 || line.message.indexOf('removeJournalFiles') === 0)){
        lifecycle = 'shutdown';
    }

    if(this._currentLifecycle !== lifecycle){
      var previous = this._currentLifecycle;
      this._currentLifecycle = lifecycle;
      this.emit('lifecycle', lifecycle, previous);
    }
    if(!this.lifecycle[lifecycle]){
      this.lifecycle[lifecycle] = [];
    }
    if(line.message !== '****'){
      this.lifecycle[lifecycle].push(line);
    }
    this._debugLifecycle(lifecycle, line);
  }

  if(line.event){
    if(line.event.name === 'ready'){
      if(line.thread === 'websvr'){
        return this.debug('old release with --http by default :(');
      }
      this.readable = true;
    }

    this.debug('emitting ', line.event);
    return this.emit(line.event.name, line.event.data);
  }
  if(!lifecycle){
    if(!this.lifecycle.unknown){
      this.lifecycle.unknown = [];
    }
    this.lifecycle.unknown.push(line);
  }
};

/**
 * Spawn a new mongod instance.
 *
 * @option {Number} port `27017`
 * @option {String} name `:#{port}`
 * @option {String} dbpath `~/mongodb/data/standalone`
 * @option {Object} params `{}` ... key -> value map to pass via `--setParameter`
 * @option {Boolean} clear `false` ... delete and recreate `dbpath` before starting
 *
 * @return {keeup.Worker}
 */
module.exports = function(opts, fn){
  opts = opts || {};

  if(typeof opts === 'function'){
    fn = opts;
    opts = {};
  }
  return new MongoD(opts).on('ready', fn.bind(null, null)).on('error', fn.bind(null));
};

module.exports.version = function(fn){
  exec('mongod --version', function(err, stdout){
    if(err) return fn(err);

    var version = stdout.toString('utf-8')
      .split('\n')[0]
      .split(',')[0]
      .replace('db version v', '');
    fn(null, version);
  });
};
