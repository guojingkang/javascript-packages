/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('params and return', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('`wait` should return the resume param(single)', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(null, 1);
      }, 0);
      const ret = fiber.wait();
      assert.equal(ret, 1);
    }, done);
  });

  it('`wait` should return the resume params(multiple)', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(null, 1, 2, 'a');
      }, 0);
      const ret = fiber.wait();
      assert.equal(ret[0], 1);
      assert.equal(ret[1], 2);
      assert.equal(ret[2], 'a');
    }, done);
  });
  it('`wait` should return the resume params(arguments)', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        (function () {
          fiber.resume(...arguments);
        }(null, 1, 2, 'a'));
      }, 0);
      const ret = fiber.wait();
      assert.equal(ret[0], 1);
      assert.equal(ret[1], 2);
      assert.equal(ret[2], 'a');
    }, done);
  });

  it('`wait` should return the resume of node-style(arguments)', (done) => {
    fibext(() => {
      const fiber = fibext();
      setTimeout(() => {
        (function () {
          fiber.resume(...arguments);
        }(null, 1));
      }, 0);
      const ret = fiber.wait();
      assert.equal(ret, 1);
    }, done);
  });


  it('done should get the return', (done) => {
    fibext(() => 1, (err, res) => {
      assert.equal(res, 1);
      done();
    });
  });
});
