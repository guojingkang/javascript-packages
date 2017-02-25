/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('nested async callback resume', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should resume from multiple nested async callbacks', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume(null, 1);
        }, 0);
      }, 0);
      const ret = wait();

      assert.equal(ret, 1);
      done();
    }, done);
  });
});
