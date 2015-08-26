#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
/*eslint no-sync:0*/
var usage = fs.readFileSync(path.resolve(__dirname, '../usage.txt')).toString();
var args = require('minimist')(process.argv.slice(2), {
  boolean: ['debug']
});

if (args.debug) {
  process.env.DEBUG = 'mongodb-runner';
}
var run = require('../');
var pkg = require('../package.json');

args.action = args.action || args._[0] || 'start';

if (args.help || args.h) {
  console.error(usage);
  process.exit(1);
}
if (args.version) {
  console.error(pkg.version);
  process.exit(1);
}

run(args, function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }
  if (args.action === 'start') {
    console.log('MongoDB started\nmongo localhost:' + args.port);
  } else {
    console.log('ok');
  }
  process.exit(0);
});
