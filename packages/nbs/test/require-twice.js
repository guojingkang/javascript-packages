/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const sandbox = require('sandboxed-module');

describe('require twice', () => {
  it('shoud not bind domain method twice', () => {
    const nbs2 = sandbox.require('../index', {
      singleOnly: true,
    });
    const wait2 = require('domain').Domain.wait;

    const nbs = require('../index');
    const wait1 = require('domain').Domain.wait;

    assert.notEqual(nbs2, nbs);
    assert.equal(wait1, wait2);
  });
});
