
const assert = require('assert');
require('..');

describe('promise-addition: .timeout()', function () {
  it('should reject when timeout', async function () {
    assert.equal(await getDelayPromise(15), 1);
    assert.equal(await getDelayPromise(5).timeout(10), 1);
    try {
      await getDelayPromise(15).timeout(5);
      throw new Error('cant reached here');
    } catch (e) {
      assert(e.timeout);
      assert.equal(e.message, 'timeout');
    }
  });
  it('should reject immediately when promise reject and not timeout', async function () {
    try {
      await getRejectPromise(5).timeout(10);
      throw new Error('cant reached here');
    } catch (e) {
      assert(!e.timeout);
      assert.equal(e.message, 'rejected');
    }
  });
  it('should use the passed timeout message', async function () {
    try {
      await getDelayPromise(15).timeout(5, 'req timeout, try again');
      throw new Error('cant reached here');
    } catch (e) {
      assert(e.timeout);
      assert.equal(e.message, 'req timeout, try again');
    }
  });
  it('should fulfill the promise even timeout', async function () {
    const result = [];

    try {
      await new Promise(resolve => Promise.delay(15).then(() => {
        result.push(1);
        return resolve();
      })).timeout(5);
      throw new Error('cant reached here');
    } catch (e) {
      assert(e.timeout);
      assert.equal(e.message, 'timeout');
    }
    await Promise.delay(11);
    assert.deepStrictEqual(result, [1]);
  });
});

function getDelayPromise(ms) {
  return new Promise(resolve => Promise.delay(ms).then(() => resolve(1)));
}

function getRejectPromise(ms) {
  return new Promise((resolve, reject) => Promise.delay(ms).then(() => reject(new Error('rejected'))));
}
