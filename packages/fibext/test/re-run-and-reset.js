/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('re-run and reset', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  // maybe should test for https://github.com/laverdet/node-fibers/issues/131
  // it()

  it('resume should always not cause the fiber stack re-run', (done) => {
    let a = 0;
    fibext(() => {
      assert.equal(a++, 0);

      const fiber = fibext();
      setTimeout(() => {
        fiber.resume();
      });
      setTimeout(() => {
        fiber.resume();
      }, 10);

      fiber.wait();
    }, done);
  });

  it('should has no effect of reset in fibext', (done) => {
    let a = 0;
    fibext(() => {
      assert.equal(a++, 0);

      const fiber = fibext();
      setTimeout(() => {
        fiber.resume();
      });

      fiber.wait();
      fiber.reset();
      fiber.resume();
    }, done);
  });
});
