
const assert = require('assert');
const fs = require('fs');
require('..');

describe('promise-addition: static members', function () {
  describe('.delay()', function () {
    it('should work', async function () {
      const now = Date.now();
      await Promise.delay(30);
      assert(Date.now() - now >= 30);
    });
  });

  describe('.promisify()', function () {
    it('should work with node callback function', async function () {
      const readFile = Promise.promisify(fs.readFile);
      const content = await readFile(__filename, 'utf8');
      assert(content.indexOf('should work with node callback function') > 0);
    });
    it('should work with context option', async function () {
      const obj = {
        foo(cb) {
          setTimeout(() => cb(null, this), 5);
        },
      };
      const foo1 = Promise.promisify(obj.foo);
      assert(await foo1() === undefined);
      assert(await foo1.call(obj) === obj);

      const foo2 = Promise.promisify(obj.foo, { context: obj });
      assert(await foo2() === obj);
      assert(await foo2.call({}) === obj);
    });
    it('should work with multiArgs option', async function () {
      const obj = {
        foo(cb) {
          setTimeout(() => cb(null, 1, 2), 5);
        },
      };
      const foo1 = Promise.promisify(obj.foo);
      assert(await foo1() === 1);

      const foo2 = Promise.promisify(obj.foo, { multiArgs: true });
      assert.deepStrictEqual(await foo2(), [1, 2]);
    });
  });

  describe('.fromCallback()', function () {
    it('should work with sync callback', async function () {
      const result = await Promise.fromCallback(cb => cb(null, 1));
      assert.equal(result, 1);
    });
    it('should work with async callback', async function () {
      const result = await Promise.fromCallback(cb => setTimeout(() => cb(null, 1), 10));
      assert.equal(result, 1);
    });
  });
});

