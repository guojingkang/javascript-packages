
const assert = require('assert');
require('..');

describe('promise-addition: Promise.each()', function () {
  it('should work with array', async function () {
    const result = await Promise.each([1, 2, 3], val => Promise.resolve(val));
    assert.deepStrictEqual(result, [1, 2, 3]);
  });
  it('should call the callback with (value, index)', async function () {
    const result = await Promise.each([1, 2, 3], (val, index) => Promise.resolve([val, index]));
    assert.deepStrictEqual(result, [[1, 0], [2, 1], [3, 2]]);
  });
  it('should work with promise-return callback', async function () {
    const result = await Promise.each([15, 5, 1], val => Promise.sleep(val).then(() => val));
    assert.deepStrictEqual(result, [15, 5, 1]);
  });
  it('should work with empty array', async function () {
    const result = await Promise.each([], val => Promise.resolve(val));
    assert.deepStrictEqual(result, []);
  });
  it('should work a promise input which return array', async function () {
    const result = await Promise.each(Promise.resolve([1, 2, 3]), val => Promise.resolve(val));
    assert.deepStrictEqual(result, [1, 2, 3]);
  });
  it('should reject on a rejected promise input', async function () {
    try {
      await Promise.each(Promise.reject('error input'), val => Promise.resolve(val));
      throw new Error('cant reached here');
    } catch (e) {
      assert.equal(e, 'error input');
    }
  });
  it('should return immediately when rejected', async function () {
    const result = [];
    try {
      await Promise.each([1, 2, 3], (val, index) => (val === 2 ? Promise.reject(`error on ${val}`) : result.push(val)));
      throw new Error('cant reached here');
    } catch (e) {
      await Promise.sleep(30);
      assert.equal(e, 'error on 2');
    }
    assert.deepStrictEqual(result, [1]);
  });
  it('should reject when callback throws error', async function () {
    try {
      await Promise.each([1], (val, index) => {
        throw new Error('error thrown');
      });
      throw new Error('cant reached here');
    } catch (e) {
      assert.equal(e.message, 'error thrown');
    }
  });
});

