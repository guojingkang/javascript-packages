/* eslint-env mocha */


const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const packFileName = `${projectName}-0.0.1.tgz`;
const env = helper.createEnv(projectName);

describe('publish', function () {
  before(function () {
    env.link();
    env.command('build');
    env.command('create .npmignore');
  });
  after(function () {
    env.unlink();
    env.remove('lib');
    env.remove('.babelrc');
    env.remove('.npmignore');
    // env.remove(packFileName);
  });
  it('should pack right', function () {
    this.timeout(10000);
    assert(!env.exists(packFileName));
    env.command('publish -p');
    assert(env.exists(packFileName));
  });
});

