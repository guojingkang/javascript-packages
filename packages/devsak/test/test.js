/* eslint-env mocha */


const assert = require('assert');
const helper = require('./helper');

const projectName = 'devsak-test-package';
const env = helper.createEnv(projectName);

describe('test', function () {
  before(function () {
    env.link();
  });
  after(function () {
    env.unlink();
    env.remove('test');
  });
  it('should test without errors', function () {
    this.timeout(10000);
    env.write('test/empty.test.js', '');
    env.command('test');
  });
  it('should test with errors', function () {
    this.timeout(10000);
    env.write('test/error.test.js', `
/* eslint-env mocha */
describe('error', function(){
  it('should not passed', function(){
    throw new Error('not passed');
  })
})
`);
    try {
      env.command('test');
    } catch (e) {
      assert(e.message.indexOf('error should not passed') >= 0);
      assert(e.message.indexOf('Error: not passed') >= 0);
      assert(e.message.indexOf('error.test.js:') >= 0);
    }
  });
});

