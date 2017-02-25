
const assert = require('assert');
const fs = require('fs');
require('..');

describe('promise-addition: static members', function () {
  describe('.sleep()', function () {
    it('should work', async function () {
      const now = Date.now();
      await Promise.sleep(30);
      assert(Date.now() - now >= 30);
    });
  });
  describe('.promisify()', function () {
    it('should work with node callback function', async function () {
      const readFile = Promise.promisify(fs.readFile);
      const content = await readFile(__filename, 'utf8');
      assert(content.indexOf('should work with node callback function') > 0);
    });
    it('should promisify all if passed with object', async function () {
      const pfs = Promise.promisify(fs);
      const content = await pfs.readFile(__filename, 'utf8');
      assert(content.indexOf('should work with node callback function') > 0);
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

