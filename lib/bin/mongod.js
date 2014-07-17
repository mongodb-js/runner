var manager = require('../manager'),
  bin = require('./'),
  assert = require('assert'),
  fs = require('fs-extra'),
  keepup = require('keepup'),
  path = require('path'),
  untildify = require('untildify'),
  log = require('mongodb-log');

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
  opts.dbpath = path.resolve(untildify((opts.dbpath || '~/mongodb/data/standalone')));
  opts.params = opts.params || {};
  opts.clear = opts.clear || false;

  var debug = require('debug')('mongod:' + opts.name), cmd, program;

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

  if(opts.keyFile){
    fs.chmodSync(opts.keyFile, '600');
  }

  debug('starting mongod', cmd.toString());

  program = keepup(cmd.toString());
  program.options = opts;
  program.uri = 'mongodb://localhost:' + opts.port;

  // @todo: should kill everything and exit if we get a non-zero exit code
  program.on('ready', fn.bind(null, null, program))
    .on('error', console.error.bind(console))
    .on('data', function(buf){
      var messages = log.parse(buf.toString().split('\n'));
      messages.filter(function(msg){
        debug(msg.message);
        return msg.event !== null;
      }).map(function(msg){
        return msg.event;
      }).map(function(evt){
        debug(evt.name, evt.data);
        if(evt.name === 'ready'){
          program.emit(evt.name, evt.data);
        }
      });
    });

  manager.add(program);
  return program;
};
