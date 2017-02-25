/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('wrong usage', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  const asyncStackError = /cannot wait in async stack\(do NOT ignore this error!\)/;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should not use wait in the async stack', (done) => {
    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume();
        }, 100);

        assert.throws(() => {
          wait();
        }, asyncStackError);

        done();
      });
    }, done);
  });


  it('should break the fiber stack when resume from the async stack', (done) => {
    // ATTENTION! do NOT use wait in the async stack, this example will show you the bad effect!!!
    nbs.run(() => {
      setTimeout(() => {
        setTimeout(() => {
          resume();// it will resume the last wait
        }, 100);

        assert.throws(() => {
          wait();
        }, asyncStackError);
      });

      setTimeout(resume, 50);
      wait();

      wait();// it will not block!
      done();
    }, done);
  });
});
