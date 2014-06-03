#!/usr/bin/env node
require('../').listen(function(err){
  if(err){
    console.error('Trouble starting mongo', err);
    process.exit(1);
  }
});
