
const assert = require('assert');
require('..');

describe('promise-addition: Promise.map()', function () {
  describe('input param', function () {
    it('should work with simple array', async function () {
      const result = await Promise.map([1, 2, 3], val => Promise.resolve(val));
      assert.deepStrictEqual(result, [1, 2, 3]);
    });
    it('should work with empty array', async function () {
      const result = await Promise.map([], val => Promise.resolve(val));
      assert.deepStrictEqual(result, []);
    });
    it('should work a promise input which return array', async function () {
      const result = await Promise.map(Promise.resolve([1, 2, 3]), val => val);
      assert.deepStrictEqual(result, [1, 2, 3]);
    });
  });

  describe('iterator param', function () {
    it('should call the iterator with (value, index)', async function () {
      const result = await Promise.map([1, 2, 3], (val, index) => Promise.resolve([val, index]));
      assert.deepStrictEqual(result, [[1, 0], [2, 1], [3, 2]]);
    });
    it('should work with async iterator', async function () {
      const result = await Promise.each([15, 5, 1], val => Promise.delay(val).then(() => val));
      assert.deepStrictEqual(result, [15, 5, 1]);
    });
  });

  describe('resolve', function () {
    it('should keep the output order same with input', async function () {
      const result = await Promise.map([15, 5, 1], val => Promise.delay(val).then(() => val));
      assert.deepStrictEqual(result, [15, 5, 1]);
    });
  });

  describe('reject', function () {
    it('should reject on a rejected promise input', async function () {
      try {
        await Promise.map(Promise.reject('error input'), val => Promise.resolve(val));
        throw new Error('cant reached here');
      } catch (e) {
        assert.equal(e, 'error input');
      }
    });
    it('should reject immediately when one item promise rejected', async function () {
      const result = [];
      try {
        await Promise.map([1, 2, 3], (val, index) => (val === 1 ? Promise.reject(`error on ${val}`) : result.push(val)), { concurrency: 2 });
        throw new Error('cant reached here');
      } catch (e) {
        await Promise.delay(30);
        assert.equal(e, 'error on 1');
      }
      assert.deepStrictEqual(result, [2]);
    });
    it('should reject when iterator throws error', async function () {
      try {
        await Promise.map([1, 2, 3], (val, index) => {
          throw new Error('error thrown');
        });
        throw new Error('cant reached here');
      } catch (e) {
        assert.equal(e.message, 'error thrown');
      }
    });
  });

  describe('concurrency option', function () {
    it('should run all item promises concurrently', async function () {
      const now = Date.now();
      await Promise.map([10, 10, 10], val => Promise.delay(val));
      assert(Date.now() - now < 20);
    });
    it('should treat non-positive concurrency number as Infinity', async function () {
      let now = Date.now();
      await Promise.map([10, 10, 10], val => Promise.delay(val), { concurrency: 0 });
      assert(Date.now() - now < 20);
      now = Date.now();
      await Promise.map([10, 10, 10], val => Promise.delay(val), { concurrency: -1 });
      assert(Date.now() - now < 20);
      now = Date.now();
      await Promise.map([10, 10, 10], val => Promise.delay(val), { concurrency: 1 });
      assert(Date.now() - now >= 30);
    });
    it('should run next immediately after one fulfilled with throttled', async function () {
      const order = [],
        order2 = [];
      await Promise.map([15, 5, 1], (val) => {
        order.push(val);
        return Promise.delay(val).then(() => {
          order2.push(val);
          return val;
        });
      }, { concurrency: 2 });
      assert.deepStrictEqual(order, [15, 5, 1]);
      assert.deepStrictEqual(order2, [5, 1, 15]);
    });
  });
});

