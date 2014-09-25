var assert = require('assert'),
  dbpath = require('../lib').options.dbpath,
  keyfile = require('../lib').options.keyfile,
  platform = require('os').platform(),
  untildify = require('untildify'),
  path = require('path'),
  fs = require('fs-extra');


describe('Options', function(){
  describe('dbpath', function(){
    after(function(done){
      dbpath.cleanup('test', done);
    });
    it('should create and resolve the right dbpath', function(done){
      dbpath('test', function(err, res){
        assert.ifError(err);
        var base = (platform !== 'win32') ? untildify('~/') : (process.env.LOCALAPPDATA || process.env.APPDATA),
          dest = path.resolve(base, './.mongodb/data/test');
        assert.equal(dest, res);
        done();
      });
    });
  });
  describe('keyfile', function(){
    var src = path.resolve(__dirname + '/../keys/mongodb-keyfile');
    before(function(done){
      fs.chmod(src, '644', done);
    });

    it('should make sure the file has the correct permissions', function(done){
      keyfile(src, done);
    });

    after(function(done){
      fs.chmod(src, '600', done);
    });

  });
});
