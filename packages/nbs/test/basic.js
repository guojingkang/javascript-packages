/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('basic', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should be asynchronous outside, synchronous inside', (done) => {
    let outer = 1;
    nbs.run(() => {
      assert.equal(outer, 1);
      setTimeout(() => {
        outer = 2;
        resume();
      }, 0);
      wait();
      assert.equal(outer, 2);

      setTimeout(resume, 10);
      wait();

      setTimeout(resume.bind(null, null, 'a'), 10);
      assert.equal(wait(), 'a');

      assert.equal(wait(setTimeout(resume.bind(null, null, 'b'), 10)), 'b');

      const now = Date.now();
      nbs.sleep(50);
      assert(Date.now() - now >= 50);

      done();
    }, done);
    assert.equal(outer, 1);
  });
});
