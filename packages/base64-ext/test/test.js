/* eslint-env mocha */

const assert = require('assert');
const base64 = require('..');

describe('base64', () => {
  describe('basic', () => {
    it('should work', () => {
      let str = base64.encode('a');
      assert.equal(str, 'YQ==');
      assert.equal(base64.decode(str), 'a');

      str = base64.encode('中');
      assert.equal(str, '5Lit');
      assert.equal(base64.decode(str), '中');
    });
  });
  describe('url', () => {
    it('should work with replace / to _', () => {
      assert.equal(base64.encode('ab?'), 'YWI/');
      assert.equal(base64.encodeURL('ab?'), 'YWI_');
      assert.equal(base64.decodeURL('YWI_'), 'ab?');
    });
    it('should work with remove ending =', () => {
      assert.equal(base64.encode('a'), 'YQ==');
      assert.equal(base64.encodeURL('a'), 'YQ');
      assert.equal(base64.decodeURL('YQ'), 'a');
    });
  });
});

