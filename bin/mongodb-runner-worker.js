#!/usr/bin/env node
var debug = require('debug')('mongodb-runner:bin:mongodb-runner-worker.js');
var args = require('minimist')(process.argv.slice(2), {});
var startWorker = require('../lib/worker');

debug('Starting...');
startWorker(args, function(err) {
  /* eslint no-console:0 */
  if (err) {
    console.error(
      'mongodb-runner:bin:mongodb-runner-worker.js Unexpected error. Exiting.',
      err
    );
    process.exit(1);
    return;
  }

  debug('MongoDB processes spawned successfully!');

  debug(
    'Remaining alive in the background to await control commands from parent process...'
  );
});
