
const path = require('path');
const fs = require('fs-extra');
const shell = require('shelljs');

const rootDirPath = path.resolve(__dirname, '..');
const cliPath = path.resolve(rootDirPath, 'bin/cli.js');

function linkWebsak(projectDir) {
  const nmPath = path.resolve(projectDir, 'node_modules');
  const linkTargetDir = path.resolve(nmPath, 'devsak');
  shell.exec(`mkdir -p ${nmPath} && ln -s ${rootDirPath} ${linkTargetDir}`);
}

function unlinkWebsak(projectDir) {
  const linkTargetDir = path.resolve(projectDir, 'node_modules/devsak');
  shell.exec(`unlink ${linkTargetDir}`);
}

function execCommand(projectDir, cmd) {
  cmd = `node ${cliPath} ${cmd}`;
  const result = shell.exec(cmd, { cwd: projectDir, silent: true });
  if (result.status || result.code) {
    throw new Error(result.stderr || result.stdout);
  }
}

function removeProjectFile(projectDir, fileRelativePath) {
  const filePath = path.resolve(projectDir, fileRelativePath);
  if (!exports.exists(filePath)) return;
  exports.remove(filePath);
}

function readProjectFile(projectDir, fileRelativePath) {
  const filePath = path.resolve(projectDir, fileRelativePath);
  return fs.readFileSync(filePath, { encoding: 'utf8' });
}

function existsProjectFile(projectDir, fileRelativePath) {
  return exports.exists(path.resolve(projectDir, fileRelativePath));
}

function writeProjectFile(projectDir, fileRelativePath, content) {
  const filePath = path.resolve(projectDir, fileRelativePath);
  fs.mkdirpSync(path.dirname(filePath));
  return fs.writeFileSync(filePath, content);
}

exports.createEnv = function (projectName) {
  const projectDir = path.resolve(__dirname, `fixtures/${projectName}`);
  return {
    link: linkWebsak.bind(null, projectDir),
    unlink: unlinkWebsak.bind(null, projectDir),
    command: execCommand.bind(null, projectDir),
    remove: removeProjectFile.bind(null, projectDir),
    exists: existsProjectFile.bind(null, projectDir),
    read: readProjectFile.bind(null, projectDir),
    write: writeProjectFile.bind(null, projectDir),
  };
};

exports.remove = function (filePath) {
  fs.removeSync(filePath);
};

exports.exists = function (filePath) {
  try {
    fs.accessSync(filePath, fs.R_OK);
    return true;
  } catch (e) {
    return false;
  }
};

