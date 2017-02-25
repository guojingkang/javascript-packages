

const path = require('path');
const shell = require('shelljs');
const util = require('../util');
const readlineSync = require('readline-sync');

const defaultRcPath = path.resolve(__dirname, '../../resources/default-.babelrc');

exports.command = '.babelrc';
exports.describe = 'Create .babelrc';

exports.builder = function builder(yargs) {
  return yargs
    .options({
    });
};

exports.handler = function handler(argv) {
  const babelRcPath = path.resolve(process.cwd(), '.babelrc');
  const exists = util.fileExists(babelRcPath);
  if (exists) {
    if (!readlineSync.keyInYN('.babelrc exists. Overwrite?')) return;
  }

  const cmd = `cp ${defaultRcPath} ${babelRcPath}`;
  shell.exec(cmd);
  console.log('Create .babelrc file successfully!');
};

