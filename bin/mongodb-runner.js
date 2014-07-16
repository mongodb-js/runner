#!/usr/bin/env node
var runner = require('../'),
  yargs = require('yargs'),
  name = yargs.argv._[0] || process.env.RUNNER_RECIPE || 'all',
  recipe = runner.recipes[name];

recipe(yargs.argv, function(err){
  if(err) return console.error(err);
  console.log(name + ' ready');
});

// @todo: This should just start an http ctl server like mongodb-bridge
// @todo: Fork mongo procs? like so:
// Example of detaching a long-running process and redirecting its output to a file:
//  var fs = require('fs'),
//      spawn = require('child_process').spawn,
//      out = fs.openSync('./out.log', 'a'),
//      err = fs.openSync('./out.log', 'a');
//  var child = spawn('prg', [], {
//    detached: true,
//    stdio: [ 'ignore', out, err ]
//  });
//  child.unref();
