const path = require('path');
const yargs = require('yargs');
const util = require('./util');

util.addCommands(yargs, path.resolve(__dirname, '../lib/commands'));

yargs// eslint-disable-line no-unused-expressions
  .demand(1)
  .version()
  .help()
  .epilog('Copyright 2016 kiliwalk')
  .argv;
