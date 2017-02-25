/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('resume before wait', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should not wait when rsw', (done) => {
    fibext(() => {
      let fiber = fibext(),
        rsw = false;
      (function syncFunction() {
        fiber.resume();
        rsw = true;
      }());
      if (!rsw) fiber.wait();
    }, done);
  });

  it('should throw the error in the resume when rsw', (done) => {
    fibext(() => {
      let fiber = fibext(),
        rsw = false;
      (function syncFunction() {
        fiber.resume(...arguments);
        rsw = true;
      }(new Error('xxxx')));
      if (!rsw) fiber.wait();
    }, (err) => {
      assert.equal(err.message, 'xxxx');
      done();
    });
  });

  it('should return the params in resume\' return when rsw', (done) => {
    fibext(() => {
      let fiber = fibext(),
        rsw = false,
        ret;
      (function syncFunction() {
        ret = fiber.resume(...arguments);
        rsw = true;
      }(null, 'a'));
      if (!rsw) ret = `${fiber.wait()}b`;
      assert.equal(ret, 'a');
    }, done);
  });
});
