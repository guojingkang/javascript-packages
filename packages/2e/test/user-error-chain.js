/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');

describe('user error chain', () => {
  const BugError = require('../index').BugError;
  const UserError = require('../index').UserError;

  it('should create an empty error cause by an error', () => {
    const e = new UserError(new Error('inner error'));
    assert(e instanceof UserError);
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, '');
    assert.equal(e.name, 'UserError');
    assert.equal(e.stack.split('\n')[0], 'UserError: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with message cause by an error', () => {
    const e = new UserError(new Error('inner error'), 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with code and message cause by an error', () => {
    const e = new UserError(new Error('inner error'), 100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with formated message', () => {
    let e = new UserError(new Error('inner error'), '100', 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, '100 error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: 100 error occur: inner error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);

    e = new UserError('error occur %s', 'name');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur name');
  });

  it('should create an error with message cause by an user error', () => {
    const e = new UserError(new UserError('inner user error'), 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur: inner user error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with message cause by an bug error', () => {
    const e = new UserError(new BugError('inner bug error'), 100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur: inner bug error');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with multiple chain', () => {
    let e = new UserError(new BugError('error 1'), 100, 'error 2');
    e = new UserError(e, 'error 3');
    e = new UserError(e, 'error 4');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error 4');
    assert.equal(e.stack.split('\n')[0], 'UserError: error 4: error 3: error 2: error 1');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });
});
