/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('nested nbs', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should run with wait/resume a inner nbs fiber stack', (done) => {
    // ATTENTION!: there is no need to wait/resume the inner fiber stack,
    // for most time we use the inner fiber stack just for "the-request-async" business,
    // like send email. the next testcase will show you the right usage.

    nbs.run(() => {
      setTimeout(() => {
        resume(null, 1);
      }, 0);
      assert.equal(wait(), 1);

      const outer = process.domain.id();
      setTimeout(() => {
        assert.equal(process.domain.id(), outer);

        // inner fiber stack
        nbs.run(() => {
          const inner = process.domain.id();
          assert.notEqual(inner, outer);
          setTimeout(() => {
            assert.equal(process.domain.id(), inner);
            resume(null, 2);
          }, 0);
          assert.equal(wait(), 2);
          assert.equal(process.domain.id(), inner);
        }, done);

        assert.equal(process.domain.id(), outer);
        resume(null, 3);
      }, 0);
      assert.equal(wait(), 3);
      assert.equal(process.domain.id(), outer);

      setTimeout(() => {
        resume(null, 4);
      }, 0);
      assert.equal(wait(), 4);

      done();
    }, done);
  });

  it('should run with a inner nbs fiber stack, which is the-request-async', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(null, 1);
      }, 0);
      assert.equal(wait(), 1);

      setTimeout(() => {
        // inner fiber stack
        nbs.run(() => {
          setTimeout(() => {
            resume(null, 2);
          }, 0);
          assert.equal(wait(), 2);
        }, done);
      }, 0);

      setTimeout(() => {
        resume(null, 4);
      }, 0);
      assert.equal(wait(), 4);

      done();
    }, done);
  });
});
