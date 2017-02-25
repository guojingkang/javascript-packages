

const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const util = require('util');
module.exports = exports = util;

const confFilePath = path.resolve(process.cwd(), '.devsakconfig');
util.readConfig = function readConfig() {
  if (util.fileExists(confFilePath)) {
    return jsonfile.readFileSync(confFilePath);
  } else {
    return {};
  }
};

util.saveConfig = function saveConfig(conf) {
  util.saveJSON(confFilePath, conf);
};

util.saveJSON = function saveJSON(filePath, obj) {
  jsonfile.writeFileSync(filePath, obj, { spaces: 2 });
};

util.fileExists = function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.R_OK | fs.W_OK);
    return true;
  } catch (e) {
    return false;
  }
};

util.error = function error(...args) {
  let str = util.format(...args);
  str = chalk.red.bold(str);
  console.error(str);
};

// or using yargs.commandDir('commands'), current yargs v4.7.1 not supported
util.addCommands = function addCommands(yargs, commandDirPath) {
  const files = fs.readdirSync(commandDirPath);
  files.forEach((file) => {
    const filePath = path.join(commandDirPath, file);
    const stats = fs.lstatSync(filePath);
    if (!stats || !stats.isFile()) return;
    yargs.command(require(filePath));// eslint-disable-line import/no-dynamic-require
  });
};

// All commands must run in directory which has package.json file
util.ensurePackageRootDir = function ensurePackageRootDir() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!util.fileExists(pkgPath)) {
    util.error('Must run in directory which has package.json file');
    process.exit(1);
  }
};
