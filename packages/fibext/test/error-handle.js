/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('error handle', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should throw error with not-function', (done) => {
    assert.throws(() => {
      fibext(1);
    });
    done();
  });


  it('should throw error in fiber stack', (done) => {
    assert.throws(() => {
      fibext(() => {
        throw new Error('xxxx');
      });
    }, /xxxx/);
    done();
  });

  it('should catch the error in done thrown in fiber stack', (done) => {
    fibext(() => {
      throw new Error('fiber stack error');
    }, (err, res) => {
      assert(err instanceof Error);
      assert.equal(err.message, 'fiber stack error');
      done();
    });
  });

  it('should throw the resume error param(first) from wait', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(new Error('async function error'));
      }, 0);
      assert.throws(() => {
        fiber.wait();
      }, 'async function error');
    }, done);
  });

  it('should not throw the resume error param(not first) from wait', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(null, new Error('async function error'));
      }, 0);
      const ret = fiber.wait();
      assert(ret instanceof Error);
    }, done);
  });

  it('should throw the resume error param(first in arguments) from wait', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        (function () {
          fiber.resume(...arguments);
        }(new Error('async function error')));
      }, 0);
      assert.throws(() => {
        fiber.wait();
      });
    }, done);
  });

  it('should not throw the resume error param(not first in arguments) from wait', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        (function () {
          fiber.resume(...arguments);
        }(null, new Error('async function error')));
      }, 0);
      const ret = fiber.wait();
      assert(ret instanceof Error);
    }, done);
  });

  it('should trigger process.uncaughtException when throwing error before resume', (done) => {
    // remove mocha's listener
    const lsns = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');

    process.on('uncaughtException', (err) => {
      assert.equal(err.message, 'error before resume');

      // restore mocha's listener
      process.removeAllListeners('uncaughtException');
      lsns.forEach((lsn) => {
        process.on('uncaughtException', lsn);
      });

      done();
    });

    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        (function () {
          throw new Error('error before resume');
        }());
        fiber.resume();
      }, 0);
      fiber.wait();
    }, done);
  });
});
