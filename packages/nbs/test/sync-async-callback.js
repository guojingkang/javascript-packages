/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('sync and async callback', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should run the sync and async callbacks one-by-one', (done) => {
    function syncCallbackFunc(cb) {
      cb(null, 1, new Error('async function error'));
    }
    nbs.run(() => {
      let pair = nbs.pair();
      syncCallbackFunc(function () {
        pair.resume(...arguments);
      });
      const ret = pair.wait();
      assert.equal(ret[0], 1);

      setTimeout(() => {
        resume(null, 'b', 2, null);
      }, 0);
      const ret2 = wait();
      assert.equal(ret2[0], 'b');
      assert.equal(ret2[1], 2);

      // another sync callback
      pair = nbs.pair();
      (function () {
        pair.resume(null, 'c', 3, null);
      }());
      const ret3 = pair.wait();
      assert.equal(ret3[0], 'c');
      assert.equal(ret3[1], 3);

      done();
    }, done);
  });
});
