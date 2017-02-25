/* eslint-env mocha*/

const assert = require('assert');
const sleep = require('./helper').sleep;
const MemStore = require('../memory');

describe('kvc: empty/single key', function () {
  it('should throw when get multiple keys', async function () {
    const store = new MemStore();
    try {
      await store.get('key', 'key2');
      throw new Error('should break but not');
    } catch (e) {
      assert.equal(e.message, 'get accept only one parameter');
    }
  });
  it('should get and set one key', async function () {
    const store = new MemStore();
    const value = await store.get('key');
    assert.strictEqual(value, undefined);

    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
  });

  it('should get and set undefined value', async function () {
    const store = new MemStore();
    assert.strictEqual(await store.get('key'), undefined);
    await store.set('key', undefined);
    assert.strictEqual(store._data.key, undefined);
    assert.strictEqual(await store.get('key'), undefined);
  });

  it('should del when set undefined', async function () {
    const store = new MemStore();
    assert.strictEqual(await store.get('key'), undefined);
    await store.set('key', '123');
    assert.strictEqual(await store.get('key'), '123');
    await store.set('key', undefined);
    assert.strictEqual(store._data.key, undefined);
    assert.strictEqual(await store.get('key'), undefined);
  });

  it('should get and set one key with store ttl', async function () {
    const store = new MemStore({ ttl: 20 });
    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(20).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should get and set one key with key ttl(object options)', async function () {
    const store = new MemStore({ ttl: 10 });
    await store.set('key', 123, { ttl: 50 });
    assert.strictEqual(await store.get('key'), 123);
    await sleep(10).then(async () => assert.strictEqual(await store.get('key'), 123));
    await sleep(50).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should get and set one key with key ttl(number options)', async function () {
    const store = new MemStore({ ttl: 10 });
    await store.set('key', 123, 50);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(10).then(async () => assert.strictEqual(await store.get('key'), 123));
    await sleep(50).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should del single key', async function () {
    const store = new MemStore();
    await store.set('key', '123');
    assert.strictEqual(await store.get('key'), '123');
    await store.del('key');
    assert.strictEqual(await store.get('key'), undefined);
  });

  it('should clear', async function () {
    const store = new MemStore();
    assert.deepEqual(store._data, {});
    store.set('k', 1);
    assert.notDeepEqual(store._data, {});
    await store.clear();
    assert.deepEqual(store._data, {});
  });

  it('shoud get the keys', async function () {
    const store = new MemStore();
    store.set('key1', 1);
    store.set('key2', 2);
    assert.deepEqual(await store.keys(true), ['key1', 'key2']);
    assert.deepEqual(await store.keys('*1'), ['key1']);
    assert.deepEqual(await store.keys(/key.*/), ['key1', 'key2']);
  });

  it('should work with prefix', async function () {
    const store = new MemStore({ prefix: 'abc' });
    const value = await store.get('key');
    assert.strictEqual(value, undefined);

    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
    assert.strictEqual(store._data.key, undefined);
    assert(!!store._data.abckey);

    assert.deepEqual(await store.keys(true), ['key']);

    await store.del('key');
    assert.strictEqual(await store.get('key'), undefined);
    assert(!store._data.abckey);
  });

  it('should return size when set with returnSize option', async function () {
    const store = new MemStore();
    let result = await store.set('key', 'a');
    assert.equal(result, undefined);
    result = await store.set('key', 'a', { returnSize: true });
    assert.equal(result.size, 26);// {"value":"a"}
    result = await store.set('key', '中', { returnSize: true });
    assert.equal(result.size, 26);// {"value":"a中"}
  });
});
