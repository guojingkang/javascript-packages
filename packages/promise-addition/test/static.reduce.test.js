
const assert = require('assert');
require('..');

describe('promise-addition: Promise.reduce()', function () {
  describe('input and initialValue param', function () {
    it('should work', async function () {
      const result = await Promise.reduce([1, 2, 3], (prev, val) => prev + val, 0);
      assert.deepStrictEqual(result, 6);
      const result1 = await Promise.reduce([1, 2, 3], (prev, val) => prev + val, 1);
      assert.deepStrictEqual(result1, 7);
    });
    it('should return the initialValue with empty array input', async function () {
      const result = await Promise.reduce([], (prev, val) => prev + val);
      assert.deepStrictEqual(result, undefined);
      const result1 = await Promise.reduce([], (prev, val) => prev + val, 0);
      assert.deepStrictEqual(result1, 0);
    });
    it('should work a promise input which return array', async function () {
      const result = await Promise.reduce(Promise.resolve([1, 2, 3]), (prev, val) => prev + val, 0);
      assert.deepStrictEqual(result, 6);
    });
    it('should work with promise initialValue', async function () {
      const result = await Promise.reduce([], (prev, val) => prev + val, Promise.delay(10).then(() => 1));
      assert.deepStrictEqual(result, 1);
    });
  });

  describe('iterator param', function () {
    it('should call the iterator with (prev, value, index)', async function () {
      const result = await Promise.reduce([1, 2, 3], (prev, val, index) => [...prev, [val, index]], []);
      assert.deepStrictEqual(result, [[1, 0], [2, 1], [3, 2]]);
    });
    it('should work with async iterator', async function () {
      const result = await Promise.reduce([15, 5, 1], (prev, val) => Promise.delay(val).then(() => prev + val), 0);
      assert.deepStrictEqual(result, 21);
    });
  });

  describe('resolve', function () {
  });

  describe('reject', function () {
    it('should reject on a rejected promise input', async function () {
      try {
        await Promise.reduce(Promise.reject('error input'), (prev, val) => prev + val, 0);
        throw new Error('cant rreduceed here');
      } catch (e) {
        assert.equal(e, 'error input');
      }
    });
    it('should reject immediately when one item promise rejected', async function () {
      const result = [];
      try {
        await Promise.reduce([1, 2, 3], (prev, val) => (val === 2 ? Promise.reject(`error on ${val}`) : result.push(val)), 0);
        throw new Error('cant rreduceed here');
      } catch (e) {
        assert.equal(e, 'error on 2');
      }
      assert.deepStrictEqual(result, [1]);
    });
    it('should reject when iterator throws error', async function () {
      try {
        await Promise.reduce([1], (prev, val, index) => {
          throw new Error('error thrown');
        });
        throw new Error('cant rreduceed here');
      } catch (e) {
        assert.equal(e.message, 'error thrown');
      }
    });
  });

  describe('concurrency', function () {
    it('should run all item promises one by one', async function () {
      const now = Date.now(),
        result = [];
      await Promise.reduce([15, 7, 1], (prev, val) => Promise.delay(val).then(() => result.push(val)));
      assert(Date.now() - now >= 23);
      assert.deepStrictEqual(result, [15, 7, 1]);
    });
  });
});

