
const assert = require('assert');
require('..');

describe('promise-addition: instance members', function () {
  describe('.delay()', function () {
    it('should work', async function () {
      const result = await new Promise((resolve) => {
        const now = Date.now();
        return Promise.delay(10).then(() => resolve(now));
      });
      assert(Date.now() - result < 20);

      const result2 = await new Promise((resolve) => {
        const now = Date.now();
        return Promise.delay(10).then(() => resolve(now));
      }).delay(20);
      const gap = Date.now() - result2;
      assert(gap >= 20);
      assert(gap < 30);
    });
    it('should work with chain', async function () {
      const now1 = Date.now();
      await Promise.delay(10).delay(15).delay(25);
      const now2 = Date.now();
      const gap1 = now2 - now1;
      assert(gap1 >= 25 && gap1 < 35);
    });
    it('should work with Promise.resolve()', async function () {
      const now1 = Date.now();
      await Promise.resolve(Promise.delay(10)).delay(15);
      const now2 = Date.now();
      const gap1 = now2 - now1;
      assert(gap1 >= 15 && gap1 < 25);
    });
    it('should reject immediately', async function () {
      let time = 0;
      try {
        await new Promise((resolve, reject) => {
          time = Date.now();
          return Promise.delay(10).then(() => reject('rejected'));
        }).delay(15);
        throw new Error('cant reached here');
      } catch (e) {
        assert(Date.now() - time < 15);
      }
    });
  });

  describe('.finally()', function () {
    it('should work', async function () {
      const result = [];
      assert.equal(await Promise.delay(5).finally(() => result.push(1)).then(() => result.push(2)), 2);
      assert.deepStrictEqual(result, [1, 2]);

      assert.equal(await Promise.reject('rejected').finally(() => result.push(1)).catch(() => result.push(2)), 4);
      assert.deepStrictEqual(result, [1, 2, 1, 2]);
    });
    it('should ignore return value of callback', async function () {
      assert.deepStrictEqual(await Promise.delay(5).finally(() => 1), undefined);
      assert.deepStrictEqual(await Promise.delay(5).finally(() => 1).then(() => 2), 2);
      assert.deepStrictEqual(await Promise.reject('rejected').finally(() => 1).catch(() => 2), 2);
    });
    it('should trigger global unhandledRejection when throw in callback', async function () {
      const listeners = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');

      let error;
      process.on('unhandledRejection', (err) => {
        error = err;
      });
      const result = await Promise.delay(5).finally(() => Promise.reject('rejected')).then(() => 1);
      assert.deepStrictEqual(result, 1);

      await Promise.delay(15);
      assert.equal(error, 'rejected');

      process.removeAllListeners('unhandledRejection');
      listeners.forEach(listener => process.on('unhandledRejection', listener));
    });
  });

  describe('.asCallback()', function () {
    it('should work with resolved', async function () {
      const result = [];
      Promise.delay(5).then(() => 1).asCallback((err, ret) => {
        result.push([err, ret]);
      });
      Promise.delay(5).then(() => Promise.reject('rejected')).asCallback((err, ret) => {
        result.push([err, ret]);
      });
      await Promise.delay(30);
      assert.deepStrictEqual(result, [[null, 1], ['rejected', undefined]]);
    });
  });
});
