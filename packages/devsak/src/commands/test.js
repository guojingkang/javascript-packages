

const spawn = require('child_process').spawnSync;
// const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const util = require('../util');
util.ensurePackageRootDir();

// const readlineSync = require('readline-sync');

const myBinPath = path.resolve(__dirname, '../../node_modules/.bin');
const projectBinPath = path.resolve(process.cwd(), 'node_modules/.bin');

const myRcPath = path.resolve(__dirname, '../../resources/default-mocha.opts');
const myAllRcPath = path.resolve(__dirname, '../../resources/default-all.mocha.opts');
const projectRcPath = path.resolve(process.cwd(), 'test/mocha.opts');
const projectAllRcPath = path.resolve(process.cwd(), 'test/all.mocha.opts');

const testPath = path.resolve(process.cwd(), 'test');

exports.command = 'test';
exports.describe = 'Run test';

exports.builder = function builder(yargs) {
  return yargs
    .options({
    })
    .usage('devsak test [files...]')
    .example('devsak test', 'test all files')
    .example('devsak test test/case.test.js', 'test files only matched the pattern, same like mocha');
};

exports.handler = function handler(argv) {
  const { _ } = argv;
  let files = _.slice(1);
  if (files.length <= 0) files = ['test/**/*.test.js'];

  if (!util.fileExists(testPath)) {
    fs.mkdirSync(testPath);
  }

  const optsFilePath = getOptsFile(!!files);

  let mochaPath = path.resolve(myBinPath, 'mocha');
  if (!util.fileExists(mochaPath)) mochaPath = path.resolve(projectBinPath, 'mocha');

  const params = ['--opts', optsFilePath, ...files];
  const result = spawn(mochaPath, params, { stdio: 'inherit' });// this can preserve the color
  // shell.exec(`${mochaPath} --opts ${optsFilePath}`)
  if (result.status || result.code) {
    // util.error(result.stderr || result.stdout);
    process.exit(1);
  }
};

function getOptsFile(hasFiles) {
  const optsFilePath = hasFiles ? projectRcPath : projectAllRcPath;
  if (util.fileExists(optsFilePath)) return optsFilePath;

  // no files option, try all.mocha.opts, then mocha.opts, then template
  if (!hasFiles) {
    if (util.fileExists(projectAllRcPath)) return projectAllRcPath;
    if (util.fileExists(projectRcPath)) return projectRcPath;
    return myAllRcPath;
  }

  // has files option, try mocha.opts, then template
  if (util.fileExists(projectRcPath)) return projectRcPath;
  return myRcPath;
}

