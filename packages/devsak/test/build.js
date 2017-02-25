
const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

describe('build', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove('dist');
    env.remove('.babelrc');
  });
  it('should build right', function () {
    assert(!env.exists('dist'));
    assert(!env.exists('.babelrc'));
    env.command('build');
    assert(env.exists('dist'));
    assert(env.exists('.babelrc'));

    const content = env.read('dist/index.js');
    assert.equal(content.indexOf('const string'), -1);
    assert(content.indexOf('var string') >= 0);
  });
});

