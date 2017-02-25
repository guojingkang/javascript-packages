

const path = require('path');
const fs = require('fs');
const util = require('../util');
const readlineSync = require('readline-sync');

const npmIgnorePath = path.resolve(process.cwd(), '.npmignore');
const defaultNpmIgnorePath = path.resolve(__dirname, '../../resources/default-.npmignore');

exports.command = '.npmignore';
exports.describe = 'Create/Append .npmignore file';

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

  const exists = util.fileExists(npmIgnorePath);
  if (exists && !append) {
    if (!readlineSync.keyInYN('.npmignore exists. Overwrite?')) return;
  }

  let content = [fs.readFileSync(defaultNpmIgnorePath, { encoding: 'utf8' })];

  if (conf.output) content.push(`\n!${conf.output}/`);
  if (conf.src) content.push(`${conf.src}/`);

  content = content.join('\n');

  if (exists && append) {
    fs.appendFileSync(npmIgnorePath, content);
    console.log('Append .npmignore successfully!');
  } else {
    fs.writeFileSync(npmIgnorePath, content);
    console.log('Create .npmignore successfully!');
  }
};

