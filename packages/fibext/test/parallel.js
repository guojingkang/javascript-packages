/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('parallel', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should not disturb each other with multiple parallel fiber stacks', (done) => {
    let pending = 2;
    function got() {
      if (!--pending) done();
    }

    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        setTimeout(() => {
          fiber.resume(null, 1);
        }, 0);
      }, 0);
      const ret = fiber.wait();

      assert.equal(ret, 1);
      got();
    });
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        setTimeout(() => {
          fiber.resume(null, 3);
        }, 100);
      }, 100);
      const ret = fiber.wait();

      assert.equal(ret, 3);
      got();
    });
  });

  it('should parallel run with multiple wait/resume groups', (done) => {
    fibext(() => {
      const fiber = fibext();
      const now = Date.now();
      setTimeout(() => {
        fiber.resume(null, 1);
      }, 15);
      setTimeout(() => {
        fiber.resume(null, 2);
      }, 10);
      setTimeout(() => {
        fiber.resume(null, 3);
      }, 5);
      const reta = fiber.wait();
      const retb = fiber.wait();
      const retc = fiber.wait();
      const el = Date.now() - now;

      assert.equal(reta, 3);
      assert.equal(retb, 2);
      assert.equal(retc, 1);
      assert(el < 130);
    }, done);
  });
});
