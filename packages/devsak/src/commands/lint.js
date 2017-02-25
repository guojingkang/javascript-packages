

const shell = require('shelljs');
const path = require('path');
const util = require('../util');
util.ensurePackageRootDir();

// const readlineSync = require('readline-sync');

const myPkgDir = path.resolve(__dirname, '../../');
const myBinPath = path.resolve(myPkgDir, 'node_modules/.bin');
const projectBinPath = path.resolve(process.cwd(), 'node_modules/.bin');

const eslintRcPath = path.resolve(process.cwd(), '.eslintrc');

exports.command = 'lint';
exports.describe = 'Use eslint to check the js file';

exports.builder = function builder(yargs) {
  return yargs
    .options({
    })
    .usage('devsak lint [files...]')
    .example('devsak lint', 'lint all files')
    .example('devsak lint src bin', 'lint src and bin dirs');
};

exports.handler = function handler(argv) {
  const { _ } = argv;
  let files = _.slice(1);
  if (files.length <= 0) files = '.';
  else files = files.join(' ');

  if (!util.fileExists(eslintRcPath)) {
    return util.error('.eslintrc not exist. Use `devsak create -t .eslintrc` to create the file');
  }

  let ignorePattern = '';

  const conf = util.readConfig();
  if (conf.output) {
    ignorePattern = `--ignore-pattern ${conf.output}/`;
  }

  let eslintPath = path.resolve(myBinPath, 'eslint');
  if (!util.fileExists(eslintPath)) eslintPath = path.resolve(projectBinPath, 'eslint');
  const result = shell.exec(`${eslintPath} -c ${eslintRcPath} ${ignorePattern} ${files}`, { silent: true });
  if (result.status || result.code) {
    util.error(result.stderr || result.stdout);
    process.exit(1);
  } else {
    console.log('Lint successfully!');
  }
};

