var manager = require('../manager'),
  bin = require('./'),
  assert = require('assert'),
  fs = require('fs-extra'),
  keepup = require('keepup'),
  path = require('path'),
  untildify = require('untildify'),
  log = require('mongodb-log'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;

/**
 * @todo: .toYAML() for generating config files from DSL.
 * @todo: move to it's own module and make more like yargs in terms of
 * documenting the api as you define it.
 *
 * @param {String} binaryName `mongo|mongos|mongod`
 */
function Command(binaryName){
  assert(bin[binaryName], 'Unknown binary `'+binaryName+'`');
  this.parts = [bin('mongod')];
}

Command.prototype.option = function(name, val){
  if(val === undefined) return this;

  if(Array.isArray(val)){
    val.map(this.option.bind(this, name));
    return this;
  }

  this.parts.push.apply(this.parts, ['--' + name, val]);
  return this;
};

Command.prototype.argc = function(val){
  if(val === undefined) return this;
  this.parts.push(val);
  return this;
};

Command.prototype.toString = function(){
  return this.parts.join(' ');
};

function MongoD(command, opts, debug){
  this.command = command;
  this.options = opts;
  this.debug = debug;
  this.readable = false;
  this.lifecycle = {
    startup: [],
    shutdown: [],
    threads: {
      'initandlisten': 'startup',
      'signalProcessingThread': 'shutdown'
    }
  };

  this.uri = 'mongodb://localhost:' + opts.port;
  this.program = keepup(command.toString()).on('data', this.onData.bind(this));

  this.on('ready', this.onReady.bind(this));
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
  this.debug('shutdown messages %s', this.lifecycle.shutdown.map(function(l){return l.message;}).join('\n'));
  this.debug('goodbye %j', {code: code});
  fn();
};
MongoD.prototype.stop = function(fn){
  fn = fn || function(){};
  this.shutdownTimer = setTimeout(this.onShutdownMissed, 3000);
  this.on('exit', this.onExit.bind(this, fn));
  this.program.stop();
  return this;
};

MongoD.prototype.onData = function(buf){
  log.parse(buf.toString().split('\n')).map(this.inspectLogLine.bind(this));
  this.emit('data', buf);
};

MongoD.prototype.inspectLogLine = function(line){
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
  var lifecycleName = this.lifecycle.threads[line.thread];
  if(lifecycleName) this.lifecycle[lifecycleName].push(line);

  if(line.event){
    if(line.event.name === 'ready'){
      this.readable = true;
    }
    this.debug('emitting '+ line.event.name, line.event.data);
    return this.emit(line.event.name, line.event.data);
  }
  if(!lifecycleName) this.debug(line.message);
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

  opts.port = parseInt((opts.port || 27017), 10);
  opts.name = opts.name || '' + opts.port;
  opts.dbpath = path.resolve(untildify((opts.dbpath || '/data/db/standalone')));
  opts.params = opts.params || {};
  opts.clear = opts.clear || false;

  var debug = require('debug')('mongod:' + opts.name), cmd;

  if(opts.clear){
    debug('clearing previous data', opts.dbpath);
    fs.removeSync(opts.dbpath);
  }
  debug('create data directory', opts.dbpath);
  fs.mkdirsSync(opts.dbpath);

  cmd = new Command('mongod')
    .option('port', opts.port)
    .option('dbpath', opts.dbpath)
    .option('keyFile', opts.keyFile)
    .option('setParameter', Object.keys(opts.params).map(function(k){
      return k + '=' + opts.params[k];
    }));

  if(opts.keyFile) fs.chmodSync(opts.keyFile, '600');

  debug('starting mongod', cmd.toString());
  var mongod = new MongoD(cmd, opts, debug)
    .on('ready', fn.bind(null, null, mongod));
  return mongod;
};
