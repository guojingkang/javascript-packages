/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('bind emitter', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should bind the event emitter', (done) => {
    process.domain && process.domain.exit();

    let domainId;
    const e = new (require('events').EventEmitter)();
    assert.equal(process.domain, null);
    assert.equal(e.domain, null);

    e.on('hello', () => {
      assert.equal(process.domain.id(), domainId);
      done();
    });

    nbs.run(() => {
      domainId = process.domain.id();
      setTimeout(() => {
        resume();
      }, 0);
      wait();
      setTimeout(() => {
        e.emit('hello');
      });
      assert(e.domain !== null);
    }, e, done);
  });

  it('should bind the non event emitter', (done) => {
    process.domain && process.domain.exit();

    const a = 11;

    nbs.run(() => {
      assert.equal(process.domain.members.length, 1);
      assert.equal(process.domain.members[0], 11);
      done();
    }, a, done);
  });
});
