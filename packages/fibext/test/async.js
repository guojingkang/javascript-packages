/* eslint-env mocha*/
/* eslint-disable strict, no-console, no-func-assign*/

const assert = require('assert');

describe('async', () => {
  const fibext = require('../index');

  it('can run an async fiber stack', (done) => {
    let n = 0;
    fibext(() => {
      assert.equal(n, 0);
      fibext.async(() => {
        assert.equal(n, 1);

        const fiber = fibext();
        setTimeout(() => {
          assert.equal(n, 1);
          fiber.resume();
        });
        fiber.wait();
        n = 2;
        done();
      });
      n = 1;

      const now = Date.now();
      fibext.sleep(20);
      assert(Date.now() - now >= 20);
    });
  });
});
