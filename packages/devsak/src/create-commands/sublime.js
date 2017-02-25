

const path = require('path');
const shell = require('shelljs');
const util = require('../util');
const readlineSync = require('readline-sync');

const pkgPath = path.resolve(process.cwd(), 'package.json');
const defaultSublimeProjectPath = path.resolve(__dirname, '../../resources/default-sublime-project');

exports.command = 'sublime';
exports.describe = 'Create *.sublime-project file';

exports.builder = function builder(yargs) {
  return yargs
    .options({
    });
};

exports.handler = function handler(argv) {
  const pkgInfo = require(pkgPath);// eslint-disable-line import/no-dynamic-require

  let pkgName = pkgInfo.name;
  if (!pkgName) {
    pkgName = path.basename(process.cwd());
  }
  const sublimeFileName = `${pkgName}.sublime-project`;

  const sublimePath = path.resolve(process.cwd(), sublimeFileName);
  const exists = util.fileExists(sublimePath);
  if (exists) {
    if (!readlineSync.keyInYN(`${sublimeFileName} exists. Overwrite?`)) return;
  }

  shell.exec(`cp ${defaultSublimeProjectPath} ${sublimePath}`);

  console.log('Create sublime-project file successfully!');
};

