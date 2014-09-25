var os = require('os'),
  path = require('path'),
  untildify = require('untildify'),
  fs = require('fs-extra'),
  async = require('async'),
  debug = require('debug')('mongodb-runner:option:dbpath');

function resolve(name, fn){
  var search = [];
  if(os.platform() === 'win32'){
    search.push(path.resolve((process.env.LOCALAPPDATA || process.env.APPDATA),
      '/.mongodb/data/' + name));
  }
  else {
     search.push(untildify('~/.mongodb/data/' + name));
  }
  search.push(path.resolve(process.cwd(), '/.mongodb/data/' + name));
  async.series(search.map(function(p){
    return function(cb){
      fs.ensureDir(p, function(err){
        // bit weird but easy way to cheat async error handlers into breakers.
        return (!err) ? cb(p) : cb();
      });
    };
  }), function(res){
    if(!res) return fn(new Error('Could not create any of ' + JSON.stringify(search)));
    debug('dbpath for `%s`', name, res);
    fn(null, res);
  });
}

module.exports = resolve;
module.exports.cleanup = function(name, fn){
  resolve(name, function(err, p){
    if(err) return fn(err);
    fs.remove(p, fn);
  });
};
