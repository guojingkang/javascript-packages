/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('check hung', () => {
  const fibext = require('../index');

  afterEach(() => {
    fibext.resetConfig();
  });

  it('should check the hung fibers and print warning', (done) => {
    assert.equal(fibext.config('checkInterval'), 16000);
    assert.equal(fibext.config('hungAfter'), 30000);
    assert.equal(fibext.config('checkInterval', 10), 10);
    assert.equal(fibext.config('hungAfter', 10), 10);

    const strs = [];
    const oldWarn = console.warn;
    console.warn = function () {
      strs.push(require('util').format.apply(null, arguments));
    };
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume();
      }, 29);
      fiber.wait();
      console.warn = oldWarn;
      assert(strs.length > 1);
      assert(strs[0].indexOf('WARNING! 1 fiber(s) might be hung and cause memory leak') > 0);
      // console.log(strs[1]);
      assert(strs[1].split('\n')[0].indexOf('check-hung.js:29') > 0);
    }, done);
  });

  it('should check the hung fibers and use custom listener', (done) => {
    fibext.config('checkInterval', 10);
    fibext.config('hungAfter', 20);
    fibext.on('hung', (fibers) => {
      assert.equal(fibers.length, 1);
    });
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume();
      }, 30);
      fiber.wait();
    }, done);
  });
});
