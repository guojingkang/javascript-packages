

const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

const babelRcFileName = '.babelrc';

describe('create .babelrc', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove(babelRcFileName);
  });
  it('should create a new .babelrc file', function () {
    assert(!env.exists(babelRcFileName));
    env.command('create .babelrc');
    assert(env.exists(babelRcFileName));
  });
});

