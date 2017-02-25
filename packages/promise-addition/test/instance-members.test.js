
const assert = require('assert');
require('..');

describe('promise-addition: instance members', function () {
  describe('.delay()', function () {
    it('should work', async function () {
      const result = await new Promise((resolve) => {
        const now = Date.now();
        return Promise.sleep(5).then(() => resolve(now));
      });
      assert(Date.now() - result < 15);


      const result2 = await new Promise((resolve) => {
        const now = Date.now();
        return Promise.sleep(5).then(() => resolve(now));
      }).delay(15);
      assert(Date.now() - result2 >= 15);
    });
    it('should reject immediately', async function () {
      let time = 0;
      try {
        await new Promise((resolve, reject) => {
          time = Date.now();
          return Promise.sleep(5).then(() => reject('rejected'));
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
      assert.equal(await Promise.sleep(5).finally(() => result.push(1)).then(() => result.push(2)), 2);
      assert.deepStrictEqual(result, [1, 2]);

      assert.equal(await Promise.reject('rejected').finally(() => result.push(1)).catch(() => result.push(2)), 4);
      assert.deepStrictEqual(result, [1, 2, 1, 2]);
    });
    it('should ignore return value of callback', async function () {
      assert.deepStrictEqual(await Promise.sleep(5).finally(() => 1), undefined);
      assert.deepStrictEqual(await Promise.sleep(5).finally(() => 1).then(() => 2), 2);
      assert.deepStrictEqual(await Promise.reject('rejected').finally(() => 1).catch(() => 2), 2);
    });
    it('should trigger global unhandledRejection when throw in callback', async function () {
      const listeners = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');

      let error;
      process.on('unhandledRejection', (err) => {
        error = err;
      });
      const result = await Promise.sleep(5).finally(() => Promise.reject('rejected')).then(() => 1);
      assert.deepStrictEqual(result, 1);

      await Promise.sleep(15);
      assert.equal(error, 'rejected');

      process.removeAllListeners('unhandledRejection');
      listeners.forEach(listener => process.on('unhandledRejection', listener));
    });
  });
});
