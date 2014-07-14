#!/usr/bin/env node
var runner = require('../'),
  yargs = require('yargs'),
  recipe;

recipe = runner.recipes[yargs.argv._[0]];

if(recipe){
  recipe(yargs.argv, function(err){
    if(err) return console.error(err);
    console.log(yargs.argv._[0] + ' ready');
  });
}
else {
  runner.listen(function(err){
    if(err){
      console.error('Trouble starting mongo', err);
      process.exit(1);
    }
  });
}
