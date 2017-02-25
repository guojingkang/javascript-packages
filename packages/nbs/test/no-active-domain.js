/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('no active domain', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('shoud throw on an exit domain', (done) => {
    if (process.domain) process.domain.exit();
    nbs.run(() => {
      process.domain.exit();
      assert.throws(() => {
        wait();
      });
      assert.throws(() => {
        resume();
      });
      done();
    }, done);
  });
});
