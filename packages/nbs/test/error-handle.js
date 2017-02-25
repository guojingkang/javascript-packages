/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('error handle', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });


  it('should throw the resume error param(first) from wait', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(new Error('async function error'));
      }, 0);
      assert.throws(() => {
        wait();
      });
      done();
    }, done);
  });

  it('should not throw the resume error param(not first) from wait', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume('hah', new Error('async function error'));
      }, 0);
      const ret = wait();
      assert(ret instanceof Error);

      done();
    }, done);
  });

  it('should throw the resume error param(first in arguments) from wait', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        (function () {
          resume(...arguments);
        }(new Error('async function error')));
      }, 0);
      assert.throws(() => {
        wait();
      });
      done();
    }, done);
  });

  it('should not throw the resume error param(not first in arguments) from wait', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        (function () {
          resume(...arguments);
        }(null, new Error('async function error')));
      }, 0);
      const ret = wait();
      assert(ret instanceof Error);
      done();
    }, done);
  });

  it('should catch the error thrown before resume', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        (function () {
          throw new Error('error before resume');
        }());
        resume();
      }, 0);
      wait();
    }, (err) => {
      assert.equal(err.message, 'error before resume');
      done();
    });
  });


  it('should catch the error throw with the default handler', (done) => {
    nbs.resetConfig();

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

    nbs.run(() => {
      throw new Error('error before resume');
    });
  });

  it('should catch the error thrown when handle the error', (done) => {
    // remove mocha's listener
    const lsns = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', (err) => {
      assert.equal(err.message, 'error in domain error listener');

      // restore mocha's listener
      process.removeAllListeners('uncaughtException');
      lsns.forEach((lsn) => {
        process.on('uncaughtException', lsn);
      });

      done();
    });

    nbs.run(() => {
      throw new Error('error before resume');
    }, (err) => {
      throw new Error('error in domain error listener');
    });
  });


  it('should catch the subsequent error with the main error handler', (done) => {
    let count = 1;
    nbs.run(() => {
      setTimeout(() => {
        throw new Error('error 2');
      }, 0);
      throw new Error('error 1');
    }, (err) => {
      if (count++ === 1) {
        assert.equal(err.message, 'error 1');
      } else {
        assert.equal(err.message, 'error 2');
        done();
      }
    });
  });


  it('should catch the subsequent error with the config error handler', (done) => {
    nbs.config({ onSubError(err) {
      assert.equal(err.message, 'error 2');
      done();
    } });
    nbs.run(() => {
      setTimeout(() => {
        throw new Error('error 2');
      }, 0);
      throw new Error('error 1');
    }, (err) => {
      assert.equal(err.message, 'error 1');
    });
  });

  it('should catch the subsequent error with the custom error handler', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        throw new Error('error 2');
      }, 0);
      throw new Error('error 1');
    }, (err) => {
      assert.equal(err.message, 'error 1');
    }, (err) => {
      assert.equal(err.message, 'error 2');
      done();
    });
  });


  it('should catch the error thrown in async cb before resume and end the fiber stack', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume(null, 1);
        });
        throw new Error('error before resume');
      }, 0);
      wait();
      done(); // will never be called
      console.log('after wait');
    }, (err) => {
      assert.equal(err.message, 'error before resume');
      done();
    }, (err) => {
      assert.equal(err.message, null);
    });
  });
});
