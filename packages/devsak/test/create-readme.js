

const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

const readmeFileName = 'README.md';

describe('create readme', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove(readmeFileName);
  });
  it('should create a new readme file', function () {
    assert(!env.exists(readmeFileName));
    env.command('create readme');
    assert(env.exists(readmeFileName));
  });
});

