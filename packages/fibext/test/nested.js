/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('nested', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should be run with the same fiber stack', (done) => {
    fibext(() => {
      const fiber1 = fibext();
      setTimeout(() => {
        fiber1.resume(null, 1);
      }, 0);
      let ret = fiber1.wait(1);
      assert.equal(ret, 1);

      fibext(() => {
        const fiber2 = fibext();
        setTimeout(() => {
          fiber2.resume(null, 2);
        });
        ret = fiber2.wait();
        return 3;
      }, (err, res) => {
        assert.equal(res, 3);
      });
      assert.equal(ret, 2);
    }, done);
  });

  it('should run with wait/resume an inner fiber stack', (done) => {
    // ATTENTION!: there is no need to wait/resume the inner fiber stack,
    // for most time we use the inner fiber stack just for "the-request-async" business,
    // like send email. the next testcase will show you the right usage.

    fibext(() => {
      const fiberOuter = fibext();
      setTimeout(() => {
        fiberOuter.resume(null, 1);
      }, 0);
      assert.equal(fiberOuter.wait(), 1);

      setTimeout(() => {
        // inner fiber stack
        fibext(() => {
          const fiberInner = fibext();
          setTimeout(() => {
            fiberInner.resume(null, 2);
          }, 0);
          assert.equal(fiberInner.wait(), 2);
          return 5;
        }, (err, res) => {
          assert.equal(res, 5);
          fiberOuter.resume(null, 3);
        });
      }, 0);
      assert.equal(fiberOuter.wait(), 3);

      setTimeout(() => {
        fiberOuter.resume(null, 4);
      }, 0);
      assert.equal(fiberOuter.wait(), 4);
    }, done);
  });

  it('should run with a inner nbs fiber stack, which is the-request-async', (done) => {
    fibext(() => {
      const fiberOuter = fibext();
      setTimeout(() => {
        fiberOuter.resume(null, 1);
      }, 0);
      assert.equal(fiberOuter.wait(), 1);

      setTimeout(() => {
        // inner fiber stack
        fibext(() => {
          const fiberInner = fibext();
          setTimeout(() => {
            fiberInner.resume(null, 2);
          }, 0);
          assert.equal(fiberInner.wait(), 2);
        }, done);
      }, 0);

      setTimeout(() => {
        fiberOuter.resume(null, 4);
      }, 0);
      assert.equal(fiberOuter.wait(), 4);
    });
  });

  it('should throw error in fiber stack', (done) => {
    assert.throws(() => {
      fibext(() => {
        fibext(() => {
          throw new Error('xxxx');
        });
      });
    }, /xxxx/);

    done();
  });

  it('should catch the thrown error in the inner fiber stack', (done) => {
    fibext(() => {
      fibext(() => {
        throw new Error('xxxx');
      }, (err) => {
        assert.notEqual(err, null);
      });
    });
    done();
  });
});
