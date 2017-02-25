/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('resume before wait', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should hung when resume before wait without explicit pair', (done) => {
    setTimeout(done, 500);

    let outer = 1;
    function syncCallbackFunc(cb) {
      cb(null, 1, new Error('async function error'));
    }
    nbs.run(() => {
      assert.equal(outer, 1);
      syncCallbackFunc(function () {
        outer = 2;
        resume(...arguments);
      });
      assert.equal(outer, 2);
      wait();
      done(new Error('should not done here'));
    }, () => {});
  });

  it('should not hung the fiber stack when run resume before wait in a sync callback', (done) => {
    let outer = 1;
    function syncCallbackFunc(cb) {
      cb(null, 1, new Error('async function error'));
    }
    nbs.run(() => {
      assert.equal(outer, 1);
      const pair = nbs.pair();
      syncCallbackFunc(function () {
        outer = 2;
        pair.resume(...arguments);
      });
      assert.equal(outer, 2);
      const ret = pair.wait();

      assert.equal(outer, 2);
      assert.equal(ret[0], 1);
      assert(ret[1] instanceof Error);
      done();
    }, done);
  });
});
