

const path = require('path');
const shell = require('shelljs');
const ignore = require('ignore-file');
const util = require('../util');
util.ensurePackageRootDir();

const pkgPath = path.resolve(process.cwd(), 'package.json');

exports.command = 'publish';
exports.describe = 'Publish to npm';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      src: {
        demand: true,
        describe: 'The source directory name',
        default: 'src',
        type: 'string',
      },
      check: {
        alias: 'c',
        describe: 'Check the package files list other than upload to the npm server',
        type: 'boolean',
      },
      pack: {
        alias: 'p',
        describe: 'Pack the package files other than upload to the npm server',
        type: 'boolean',
      },
    });
};

exports.handler = function handler(argv) {
  const { _, tag, access, check, pack, src } = argv;

  const isIgnored = ignore.sync('.npmignore') || ignore.sync('.gitignore');
  if (!isIgnored(`/${src}/`)) {
    return util.error(`The source dir ${src} should be ignored in .npmignore\nTry \`devsak create .npmignore\` first`);
  }

  if (check) {
    console.log('Publish check successfully!');
    return;
  }

  if (pack) {
    const pkgInfo = require(pkgPath);// eslint-disable-line import/no-dynamic-require
    const tarFileName = `${pkgInfo.name}-${pkgInfo.version}.tgz`;
    shell.exec('npm pack', { silent: true });
    console.log(`Pack result file: ${tarFileName}`);
    console.log(`Use \`tar ztvf ${tarFileName}|more\` to see the file list`);
    return;
  }

  console.log('Uploading to npm...');
  const tagOption = tag ? `--tag ${tag}` : '',
    accessOption = access ? `--access ${access}` : '';
  const folderOption = _.slice(1)[0] || '';
  const cmd = `npm publish ${folderOption} ${tagOption} ${accessOption}`;
  shell.exec(cmd);
  console.log('Publish successfully!');
};

