/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('params and return', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    waitF = nbs.waitF,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('`waitF` should return the resume param(single)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(1);
      }, 0);
      const ret = waitF();
      assert.equal(ret, 1);
      done();
    }, done);
  });

  it('`waitF` should return the resume param(multiple)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(1, 2);
      }, 0);
      const ret = waitF();
      assert.equal(ret[0], 1);
      assert.equal(ret[1], 2);
      done();
    }, done);
  });


  it('`wait` should return the resume param(single)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(1);
      }, 0);
      const ret = wait();
      assert.equal(ret, null);
      done();
    }, done);
  });

  it('`wait` should return the resume params(multiple)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        resume(null, 1, 2, 'a');
      }, 0);
      const ret = wait();
      assert.equal(ret[0], 1);
      assert.equal(ret[1], 2);
      assert.equal(ret[2], 'a');
      done();
    }, done);
  });
  it('`wait` should return the resume params(arguments)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        (function () {
          resume(...arguments);
        }(null, 1, 2, 'a'));
      }, 0);
      const ret = wait();
      assert.equal(ret[0], 1);
      assert.equal(ret[1], 2);
      assert.equal(ret[2], 'a');
      done();
    }, done);
  });

  it('`wait` should return the resume of node-style(arguments)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        (function () {
          resume(...arguments);
        }(null, 1));
      }, 0);
      const ret = wait();
      assert.equal(ret, 1);
      done();
    }, done);
  });


  it('`resume` should return the next wait param(single)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        const ret = resume();
        assert.equal(ret, 1);
      }, 0);
      wait();
      setTimeout(() => {
        resume();
      });
      wait(1);
      done();
    }, done);
  });
  it('`resume` should should return the next wait params(multiple)', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        const ret = resume();
        assert.equal(ret[0], 1);
        assert.equal(ret[1], 2);
        assert.equal(ret[2], 'a');
      }, 0);
      wait();
      setTimeout(() => {
        resume();
      });
      wait(1, 2, 'a');
      done();
    }, done);
  });

  it('the last `resume` should return the run method\'s return', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        const ret = resume();
        assert.equal(ret, 1);
      }, 0);
      wait();

      setTimeout(() => {
        const ret = resume();
        assert.equal(ret, 2);
      }, 0);
      wait(1);

      return 2;
    }, done);
    setTimeout(() => {
      done();
    }, 100);
  });
});
