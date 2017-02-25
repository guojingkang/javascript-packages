

const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

describe('lint', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove('src/lint-error.js');
  });
  it('should lint without errors', function () {
    this.timeout(10000);
    env.command('lint');
  });
  it('should lint with errors', function () {
    this.timeout(10000);
    assert(!env.exists('src/lint-error.js'));
    env.write('src/lint-error.js', 'console.log(null);');

    try {
      env.command('lint');
      assert('should eslint to error');
    } catch (e) {
      assert(e.message.indexOf('eol-last') >= 0);
      assert(e.message.indexOf('lint-error.js') >= 0);
    }
  });
});

