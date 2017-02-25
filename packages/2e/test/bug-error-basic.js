/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');
// var _ = require('underscore');

describe('bug error basic', () => {
  const BugError = require('../index').BugError;

  it('should create an empty error', () => {
    const e = new BugError();
    assert(e instanceof BugError);
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, '');
    assert.equal(e.name, 'BugError');
    assert.equal(e.stack.split('\n')[0], 'BugError');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with message', () => {
    const e = new BugError('error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with code and message', () => {
    const e = new BugError(100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with formated message', () => {
    let e = new BugError('100', 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, '100 error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: 100 error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);

    e = new BugError('error occur %s', 'name');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur name');
  });
});
