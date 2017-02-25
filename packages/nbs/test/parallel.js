/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('parallel', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should not disturb each other with multiple parallel fiber stacks', (done) => {
    let pending = 2;
    function got() {
      if (!--pending) done();
    }

    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume(null, 1);
        }, 0);
      }, 0);
      const ret = wait();

      assert.equal(ret, 1);
      got();
    }, done);
    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume(null, 3);
        }, 100);
      }, 100);
      const ret = wait();

      assert.equal(ret, 3);
      got();
    }, done);
  });

  it('should parallel run with multiple wait/resume groups', (done) => {
    nbs.run(() => {
      const now = Date.now();
      setTimeout(() => {
        resume(null, 1);
      }, 100);
      setTimeout(() => {
        resume(null, 2);
      }, 100);
      setTimeout(() => {
        resume(null, 3);
      }, 100);
      const ret1 = wait();
      const ret2 = wait();
      const ret3 = wait();
      const el = Date.now() - now;

      assert.equal(ret1 + ret2 + ret3, 6);
      assert(el < 130);
      done();
    }, done);
  });
});
