var manager = require('../manager'),
  keepup = require('keepup'),
  path = require('path'),
  untildify = require('untildify'),
  log = require('mongodb-log'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  Command = require('./command');

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

  this.options = opts;
  this.debug = require('debug')('mongodb-runner:mongod:' + opts.name);

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
  this.program = keepup(this.command.toString()).on('data', this.onData.bind(this));

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
    if(msg.indexOf('really exiting now') > -1){
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
      if(line.thread === 'websvr'){
        return this.debug('old release with --http by default :(');
      }
      this.readable = true;
    }
    this.debug('emitting ', line.event, line.thread);
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
  return new MongoD(opts).on('ready', fn.bind(null, null));
};
