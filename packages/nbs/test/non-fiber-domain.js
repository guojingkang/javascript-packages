/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('non-fiber domain', () => {
  it('shoud throw on a non-fiber-stack domain', () => {
    const domain = require('domain').create();
    assert.throws(() => {
      domain.wait();
    });

    assert.throws(() => {
      domain.resume();
    });
  });
});
