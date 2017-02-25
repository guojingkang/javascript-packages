/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('basic', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should be asynchronous outside, synchronous inside', (done) => {
    let outer = 1;
    fibext(() => {
      assert.equal(outer, 1);

      const fiber = fibext();
      setTimeout(() => {
        outer = 2;
        fiber.resume();
      });
      fiber.wait();
      assert.equal(outer, 2);

      setTimeout(fiber.resume.bind(fiber), 1);
      fiber.wait();

      setTimeout(fiber.resume.bind(fiber, null, 'a'), 1);
      assert.equal(fiber.wait(), 'a');

      assert.equal(fiber.wait(setTimeout(fiber.resume.bind(fiber, null, 'b'), 1)), 'b');

      const now = Date.now();
      fiber.sleep(10);
      fibext.sleep(10);
      assert(Date.now() - now >= 20);
    }, done);
    assert.equal(outer, 1);
  });


  it('should not have fibext in async callback or not-in-fiber stack', (done) => {
    assert.throws(() => {
      fibext();
    }, 'not in fiber stack');

    fibext(() => {
      fibext();

      setTimeout(() => {
        assert.throws(() => {
          fibext();
        }, 'not in fiber stack');
      });
    }, done);
  });


  it('should work with new fiber stack in done', (done) => {
    fibext(() => {
    }, () => {
      fibext(() => {
        fibext.sleep(1);
      }, done);
    });
  });
});
