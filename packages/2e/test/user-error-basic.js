/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');
// var _ = require('underscore');

describe('user error basic', () => {
  // var BugError = require('../index').BugError;
  const UserError = require('../index').UserError;

  it('should create an empty error', () => {
    const e = new UserError();
    assert(e instanceof UserError);
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, '');
    assert.equal(e.name, 'UserError');
    assert.equal(e.stack.split('\n')[0], 'UserError');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with message', () => {
    const e = new UserError('error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should create an error with code and message', () => {
    const e = new UserError(100, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 100);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });


  it('should create an error with formated message', () => {
    let e = new UserError('100', 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, '100 error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: 100 error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);

    e = new UserError('error occur %s', 'name');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur name');
  });


  it('should create an error with code 0 and message', () => {
    const e = new UserError(0, 'error occur');
    assert(e instanceof Error);
    assert.equal(e.type, 'user');
    assert.equal(e.code, 500);
    assert.equal(e.message, 'error occur');
    assert.equal(e.stack.split('\n')[0], 'UserError: error occur');
    assert(e.stack.split('\n')[1].indexOf(__filename) >= 0);
  });

  it('should inspect error', () => {
    const e = new UserError();
    assert.equal(require('util').inspect(e), 'UserError: ');
  });
});
