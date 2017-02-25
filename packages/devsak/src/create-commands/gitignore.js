

const path = require('path');
const fs = require('fs');
const util = require('../util');
const readlineSync = require('readline-sync');

const gitIgnorePath = path.resolve(process.cwd(), '.gitignore');
const defaultGitIgnorePath = path.resolve(__dirname, '../../resources/default-.gitignore');

exports.command = '.gitignore';
exports.describe = 'Create/Append .gitignore file';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      append: {
        alias: 'a',
        type: 'boolean',
      },
    });
};

exports.handler = function handler(argv) {
  const { append } = argv;

  const conf = util.readConfig();

  const exists = util.fileExists(gitIgnorePath);
  if (exists && !append) {
    if (!readlineSync.keyInYN('.gitignore exists. Overwrite?')) return;
  }

  let content = fs.readFileSync(defaultGitIgnorePath, { encoding: 'utf8' });
  if (conf.output) {
    content += `\n\n${conf.output}/`;
  }

  if (exists && append) {
    fs.appendFileSync(gitIgnorePath, content);
    console.log('Append .gitignore successfully!');
  } else {
    fs.writeFileSync(gitIgnorePath, content);
    console.log('Create .gitignore successfully!');
  }
};

