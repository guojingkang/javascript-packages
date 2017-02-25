/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');

describe('fibers-domain', () => {
  it('should not run in sequence', (done) => {
    let r = '';
    const fd = require('../index.js');
    fd.sync(() => {
      const domain = process.domain;
      setTimeout(() => {
        r = '1';
        domain.resume();
      }, 100);
      domain.wait();
    });

    assert.equal(r, '');
    done();
  });

  it('should run in sequence on async', (done) => {
    let r = '';
    const fd = require('../index.js');
    fd.sync(() => {
      const domain = process.domain;
      setTimeout(() => {
        r = '1';
        domain.resume();
      }, 100);
      domain.wait();
      assert.equal(r, '1');
      done();
    });
  });

  it('should run on sync callback', (done) => {
    let r = '';
    function syncWithCallback(cb) {
      cb();
    }

    const fd = require('../index.js');
    fd.sync(() => {
      const domain = process.domain;
      syncWithCallback(() => {
        r = '1';
        domain.resume();
      });
      domain.wait();
      assert.equal(r, '1');
      done();
    });
  });
});
