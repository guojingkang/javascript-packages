
const path = require('path');
const yargs = require('yargs');
const util = require('./util');
const fs = require('fs');

util.addCommands(yargs, path.resolve(__dirname, 'commands'));

const devsakCommandsPath = path.resolve(process.cwd(), 'node_modules/devsak/lib/commands');
try {
  fs.accessSync(devsakCommandsPath);
  util.addCommands(yargs, devsakCommandsPath);
} catch (e) {
}

yargs.demand(1) // eslint-disable-line no-unused-expressions
  .version()
  .help()
  .argv;
