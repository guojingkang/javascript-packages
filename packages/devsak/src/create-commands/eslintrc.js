

const path = require('path');
const shell = require('shelljs');
const util = require('../util');
const readlineSync = require('readline-sync');

const eslintRcPath = path.resolve(process.cwd(), '.eslintrc');

exports.command = '.eslintrc';
exports.describe = 'Create .eslintrc file';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      extends: {
        alias: 'e',
        demand: true,
        describe: 'Only for .eslintrc',
        default: 'easy',
        type: 'string',
      },
    });
};

exports.handler = function handler(argv) {
  const exists = util.fileExists(eslintRcPath);
  if (exists) {
    if (!readlineSync.keyInYN('.eslintrc exists. Overwrite?')) return;
  }

  const configPackageName = `eslint-config-${argv.extends.split('/')[0]}`;
  const installCmd = `npm i ${configPackageName}@latest -D`;
  console.log(`Installing the config: \`${installCmd}\``);
  shell.exec(installCmd, { silent: true });

  const content = {
    extends: argv.extends,
  };

  util.saveJSON(eslintRcPath, content);
  console.log('Create .eslintrc successfully!');
};

