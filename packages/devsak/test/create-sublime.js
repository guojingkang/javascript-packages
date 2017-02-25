

const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

const sublimeProjectFileName = `${projectName}.sublime-project`;

describe('create sublime', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove(sublimeProjectFileName);
  });
  it('should create a new sublime-project file', function () {
    assert(!env.exists(sublimeProjectFileName));
    env.command('create sublime');
    assert(env.exists(sublimeProjectFileName));
  });
});

