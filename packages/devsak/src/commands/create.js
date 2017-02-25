

const path = require('path');
const util = require('../util');
util.ensurePackageRootDir();

exports.command = 'create';
exports.describe = 'Create resources';

exports.builder = function builder(yargs) {
  util.addCommands(yargs, path.resolve(__dirname, '../create-commands'));
  return yargs.demand(2).help();
};

exports.handler = function handler(argv) {
};

