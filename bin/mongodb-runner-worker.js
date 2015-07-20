#!/usr/bin/env node
var args = require('minimist')(process.argv.slice(2), {});
var run = require('../');

run.worker(args, function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
    return;
  }
});
