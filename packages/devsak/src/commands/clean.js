

const shell = require('shelljs');
const util = require('../util');
util.ensurePackageRootDir();

exports.command = 'clean';
exports.describe = 'Clean the output directory';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      output: {
        alias: 'o',
        demand: true,
        describe: 'The output directory name',
        default: 'dist',
        type: 'string',
      },
    });
};

exports.handler = function handler(argv) {
  const { _ } = argv;
  const target = _[1] || 'dist';

  // check target dirname
  if (target.indexOf('/') >= 0 || target.indexOf('\\') >= 0) {
    throw new Error('A plain directory name requried');
  }

  shell.exec(`rm -rf ${target}`);

  console.log('Clean successfully!');
};

