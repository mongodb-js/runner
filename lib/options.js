var os = require('os'),
  path = require('path'),
  fs = require('fs-extra'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  async = require('async'),
  untildify = require('untildify'),
  debug = require('debug')('mongodb-runner:options');

module.exports = Options;

function Options(recipe, defaults){
  if (!(this instanceof Options)) return new Options(recipe);
  this.recipe = recipe;
  this.data = {};
  this.defaults = defaults;

  this.on('readable', this.onReadable.bind(this));

  process.nextTick(function(){
    async.series(['dbpath'].map(function(k){
      return this[k].bind(this);
    }.bind(this)), this.emit.bind(this, 'readable'));
  }.bind(this));

  Options.super_.call(this);
}
util.inherits(Options, EventEmitter);

Options.prototype.keys = ['dbpath', 'port', 'keyFile'];

Options.prototype.set = function(k, v){
  debug('set %s = %j', k, v);
  this.data[k] = v;
  this.emit('change:' + k, v);
  this.emit('change', {key: k, value: v});
};

Options.prototype.get = function(k){
  if(this.keys.indexOf(k) === -1){
    throw new TypeError('Unknown option ' + JSON.stringify(k));
  }
  return this.data[k] || this.defaults[k];
};

Options.prototype.dbpath = function(fn){
  var search = [];
  if(os.platform() === 'win32'){
    search.push(path.resolve((process.env.LOCALAPPDATA || process.env.APPDATA),
      '/mongodb/data/' + this.recipe.name));
  }
  else {
     search.push(untildify('~/.mongodb/data/' + this.recipe.name));
  }
  search.push(path.resolve(process.cwd(), '/mongodb/data/' + this.recipe.name));

  debug('dbpath searches', search);
  async.series(search.map(function(p){
    return function(cb){
      fs.ensureDir(p, function(err){
        // bit weird but easy way to cheat async error handlers into breakers.
        return (!err) ? cb(p) : cb();
      });
    };
  }), function(res){
    if(!res) return fn(new Error('Could not create any of ' + JSON.stringify(search)));
    this.set('dbpath', res);
    fn();
  }.bind(this));
};

Options.prototype.onReadable = function(){
  this.readable = true;
};
