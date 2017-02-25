

const shell = require('shelljs');
const path = require('path');
const util = require('../util');
util.ensurePackageRootDir();

const myPkgDir = path.resolve(__dirname, '../../');
const myBabelRcPath = path.resolve(myPkgDir, '.babelrc');
const myBinPath = path.resolve(myPkgDir, 'node_modules/.bin');
const projectBinPath = path.resolve(process.cwd(), 'node_modules/.bin');
const projectBabelRcPath = path.resolve(process.cwd(), '.babelrc');

exports.command = 'build';
exports.describe = 'Build to es5';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      src: {
        demand: true,
        describe: 'The source directory name',
        default: 'src',
        type: 'string',
      },
      output: {
        alias: 'o',
        demand: true,
        describe: 'The output directory name',
        default: 'dist',
        type: 'string',
      },
      watch: {
        alias: 'w',
        describe: 'Enter watch mode',
        type: 'boolean',
      },
    });
};

exports.handler = function handler(argv) {
  const { src, output, watch } = argv;

  // check output dirname
  if (output.indexOf('/') >= 0 || output.indexOf('\\') >= 0) {
    throw new Error('--output should be a plain directory name in current dir, no more path in it');
  }

  const srcPath = path.resolve(process.cwd(), src);
  const outputPath = path.resolve(process.cwd(), output);

  let babelPath = path.resolve(myBinPath, 'babel');
  if (!util.fileExists(babelPath)) {
    babelPath = path.resolve(projectBinPath, 'babel');
  }

  // Currently babel doesn't support --extends options, so have to copy .babelrc to project dir
  // --extends ${myBabelRcPath}
  if (!util.fileExists(projectBabelRcPath)) {
    console.log('Copy .babelrc');
    shell.exec(`cp ${myBabelRcPath} ${projectBabelRcPath}`);
  }

  const cmd = `${babelPath} ${watch ? '-w' : ''} -D --out-dir ${outputPath} ${srcPath}`;
  shell.exec(cmd, { cwd: myPkgDir });

  console.log('Build successfully!');
};

