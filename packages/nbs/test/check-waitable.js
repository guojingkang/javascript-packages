/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('check waitable', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should check the fiber stack correctly', (done) => {
    nbs.run(() => {
      assert.equal(nbs.waitable(), true);

      setTimeout(() => {
        assert.equal(nbs.waitable(), false);
        resume();
        assert.equal(nbs.waitable(), false);
      }, 0);
      wait();

      assert.equal(nbs.waitable(), true);

      done();
    }, done);
    assert.equal(nbs.waitable(), false);
  });
});
