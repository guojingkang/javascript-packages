
const assert = require('assert');
require('..');

describe('promise-addition: Promise.throttle()', function () {
  it('should work with array', async function () {
    const result = await Promise.throttle([1, 2, 3], 2, val => Promise.resolve(val));
    assert.deepStrictEqual(result, [1, 2, 3]);
  });
  it('should call the callback with (value, index)', async function () {
    const result = await Promise.throttle([1, 2, 3], 2, (val, index) => Promise.resolve([val, index]));
    assert.deepStrictEqual(result, [[1, 0], [2, 1], [3, 2]]);
  });
  it('should keep the output order same with input', async function () {
    const result = await Promise.throttle([15, 5, 1], 2, val => Promise.sleep(val).then(() => val));
    assert.deepStrictEqual(result, [15, 5, 1]);
  });
  it('should run next immediately after one fulfilled', async function () {
    const order = [],
      order2 = [];
    await Promise.throttle([15, 5, 1], 2, (val) => {
      order.push(val);
      return Promise.sleep(val).then(() => {
        order2.push(val);
        return val;
      });
    });
    assert.deepStrictEqual(order, [15, 5, 1]);
    assert.deepStrictEqual(order2, [5, 1, 15]);
  });
  it('should work with empty array', async function () {
    const result = await Promise.throttle([], 2, val => Promise.resolve(val));
    assert.deepStrictEqual(result, []);
  });
  it('should work a promise input which return array', async function () {
    const result = await Promise.throttle(Promise.resolve([1, 2, 3]), 2, val => val);
    assert.deepStrictEqual(result, [1, 2, 3]);
  });
  it('should reject on a rejected promise input', async function () {
    try {
      await Promise.throttle(Promise.reject('error input'), val => Promise.resolve(val));
      throw new Error('cant reached here');
    } catch (e) {
      assert.equal(e, 'error input');
    }
  });
  it('should return immediately when rejected', async function () {
    const result = [];
    try {
      await Promise.throttle([1, 2, 3], 2, (val, index) => (val === 1 ? Promise.reject(`error on ${val}`) : result.push(val)));
      throw new Error('cant reached here');
    } catch (e) {
      await Promise.sleep(30);
      assert.equal(e, 'error on 1');
    }
    assert.deepStrictEqual(result, [2]);
  });
  it('should reject when callback throws error', async function () {
    try {
      await Promise.throttle([1, 2, 3], 2, (val, index) => {
        throw new Error('error thrown');
      });
      throw new Error('cant reached here');
    } catch (e) {
      assert.equal(e.message, 'error thrown');
    }
  });
});

