

const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const readlineSync = require('readline-sync');
const util = require('../util');

const DEFAULT_VERSION = '0.0.1';
const DEFAULT_LICENSE = 'MIT';
const DEFAULT_MAIN = 'lib/index.js';

exports.command = 'init';
exports.describe = 'Create pacakage or project';

exports.builder = function builder(yargs) {
  return yargs
    .options({
      boilerplate: {
        alias: 'b',
        demand: true,
        describe: 'The boilerplate project',
        default: 'node',
        type: 'string',
      },
    });
};

exports.handler = function handler(argv) {
  const { boilerplate } = argv;

  let packageName;
  while (!(packageName = readlineSync.question('Enter package name:')));// eslint-disable-line no-cond-assign
  const packageDir = path.join(process.cwd(), packageName);
  fs.mkdirSync(packageDir);

  if (boilerplate === 'node') {
    let author;
    while (!(author = readlineSync.question('Enter your name:')));// eslint-disable-line no-cond-assign
    const email = readlineSync.questionEMail('Enter your email:');

    const version = DEFAULT_VERSION;
    const license = DEFAULT_LICENSE;
    const main = DEFAULT_MAIN;

    const packageInfo = {
      name: packageName,
      description: packageName,
      version,
      homepage: `https://github.com/${author}/${packageName}`,
      bugs: `https://github.com/${author}/${packageName}/issues`,
      repository: {
        type: 'git',
        url: `https://github.com/${author}/${packageName}`,
      },
      main,
      author: { name: author, email },
      license,
      scripts: {
        lint: 'devsak lint src',
        clean: 'devsak clean -o lib',
        prebuild: 'npm run lint && npm run clean',
        build: 'devsak build --src src -o lib',
        watch: 'devsak build --src src -o lib -w',
        pretest: 'npm run build',
        test: 'devsak test',
        prepublish: 'npm test && devsak publish -c',
      },
      keywords: packageName.split(/_|-|,|(?=[A-Z])/),
      engines: {
        node: '>= 4',
        npm: '>= 3',
      },
      dependencies: {},
      devDependencies: {},
    };

    const pkgPath = path.join(packageDir, 'package.json');
    util.saveJSON(pkgPath, packageInfo);

    fs.mkdirSync(path.join(packageDir, 'src'));
    fs.mkdirSync(path.join(packageDir, 'test'));

    util.saveJSON(path.join(packageDir, '.devsakconfig'), { src: 'src', output: 'lib' });

    // copy test.js
    const srcTestFilePath = path.resolve(__dirname, '../../resources/default-test.js');
    const destTestFilePath = `test/${packageName}.test.js`;
    shell.exec(`cp ${srcTestFilePath} ${destTestFilePath}`, { cwd: packageDir });

    console.log('Installing devsak as dev dependency...');
    shell.exec('npm i devsak -D', { silent: true, cwd: packageDir });

    console.log('Creating files...');
    const cmd = [
      'devsak create sublime',
      'devsak create .gitignore',
      'devsak create .npmignore',
      'devsak create readme',
      'devsak create license',
      'devsak create .babelrc',
      'devsak create .eslintrc',
    ].join(' && ');
    shell.exec(cmd, { cwd: packageDir });
  } else {
    return util.error('Currently not support this boilerplate');
  }

  console.log('Init successfully!');
};

