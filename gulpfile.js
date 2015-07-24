var gulp = require('gulp');
var path = require('path');
var exec = require('child_process').exec;
var release = require('github-release');
var pkg = require('./package.json');

gulp.task('dist', ['upload']);

gulp.task('build', function(cb) {
  exec('./node_modules/.bin/lone', function(err) {
    if (err) return cb(err);
    cb();
  });
});

gulp.task('upload', ['build'], function() {
  return gulp.src('./.lone/dist/*').pipe(release(pkg));
});


gulp.task('keyfile', function(done) {
  var key = path.resolve('./keys/mongodb-keyfile');
  exec('openssl rand -base64 741 > ' + key, function(err) {
    if (err) return done(err);
    exec('chmod 600 ' + key, function(err) {
      if (err) return done(err);

      console.log('- ' + key);
      done();
    });
  });
});

gulp.task('pem', function(done) {
  var out = path.resolve('./keys/mongodb-cert.crt');
  var keyout = path.resolve('./keys/mongodb-cert.key');
  var pem = path.resolve('./keys/mongodb.pem');

  exec('openssl req -new -x509 -days 365 -nodes'
    + ' -out ' + out + ' -keyout ' + keyout
    + ' -subj "/C=US/ST=NY/L=NYC/CN=www.mongodb.com"', function(err) {
      if (err) return done(err);

      exec('cat ' + out + ' ' + keyout + ' > ' + pem, function(err) {
        if (err) return done(err);
        console.log('- ' + out);
        console.log('- ' + keyout);
        console.log('- ' + pem);

        done();
      });
    });
});
