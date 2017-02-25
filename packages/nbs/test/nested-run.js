/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('nested run', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should be run with the same fiber stack', (done) => {
    nbs.run(() => {
      const outer = process.domain.id();
      setTimeout(() => {
        resume(null, 1);
      }, 0);
      let ret = wait(1);
      assert.equal(ret, 1);

      nbs.run(() => {
        const inner = process.domain.id();
        assert.equal(inner, outer);

        setTimeout(() => {
          resume(null, 2);
        });
        ret = wait();
      });
      assert.equal(ret, 2);

      done();
    }, done);
  });
});
