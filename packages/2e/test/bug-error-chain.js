/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');

describe('bug error chain', () => {
  const BugError = require('../index').BugError;
  const UserError = require('../index').UserError;

  it('should create an empty error cause by an error', () => {
    const e = new BugError(new Error('inner error'));
    assert(e instanceof BugError);
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, '');
    assert.equal(e.name, 'BugError');
    assert.equal(e.stack.split('\n')[0], 'BugError: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with message cause by an error', () => {
    const e = new BugError(new Error('inner error'), 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with code and message cause by an error', () => {
    const e = new BugError(new Error('inner error'), 100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with formated message', () => {
    let e = new BugError(new Error('inner error'), '100', 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, '100 error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: 100 error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);

    e = new BugError('error occur %s', 'name');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur name');
  });

  it('should create an error with message cause by an bug error', () => {
    const e = new BugError(new BugError('inner bug error'), 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur: inner bug error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with message cause by an user error', () => {
    const e = new BugError(new UserError('inner user error'), 100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'bug');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'BugError: error occur: inner user error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });
});
