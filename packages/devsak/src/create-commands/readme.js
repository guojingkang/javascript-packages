

const path = require('path');
const fs = require('fs');
const util = require('../util');
const readlineSync = require('readline-sync');

const pkgPath = path.resolve(process.cwd(), 'package.json');
const readmePath = path.resolve(process.cwd(), 'README.md');
const defaultReadme = path.resolve(__dirname, '../../resources/default-README.md');

exports.command = 'readme';
exports.describe = 'Create README.md file';

exports.builder = function builder(yargs) {
  return yargs
    .options({
    });
};

exports.handler = function handler(argv) {
  // const {type} = argv;

  const exists = util.fileExists(readmePath);
  if (exists) {
    if (!readlineSync.keyInYN('README.md exists. Overwrite?')) return;
  }

  let content = fs.readFileSync(defaultReadme, { encoding: 'utf8' });
  content = content.replace('[YEAR]', new Date().getFullYear());

  const pkgInfo = require(pkgPath);// eslint-disable-line import/no-dynamic-require

  let author;
  if (!pkgInfo.author) {
    while (!(author = readlineSync.question('Your name (Author)?')));// eslint-disable-line no-cond-assign
  } else {
    author = pkgInfo.author.name;
  }
  content = content.replace('[AUTHOR]', author);
  content = content.replace('[DESCRIPTION]', pkgInfo.description || pkgInfo.name);

  fs.writeFileSync(readmePath, content);
  console.log('Create README.md successfully!');
};

