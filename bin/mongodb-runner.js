#!/usr/bin/env node
var runner = require('../'),
  yargs = require('yargs');

runner(yargs.argv._[0], function(err, res){
  if(err) return console.error(err);
  if(res && res.uri){
    console.log(JSON.stringify({
      name: 'ready',
      uri: res.uri,
      recipe: res.recipe
    }));
  }
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
