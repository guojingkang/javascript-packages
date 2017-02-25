/* eslint-env mocha*/

const assert = require('assert');
require('./helper');
const MemStore = require('../memory');

describe('kvc: multiple keys', function () {
  it('should get/set/del multiple key', async function () {
    const store = new MemStore();
    assert.deepEqual(await store.mget('key1', 'key2', 'key3'), { key1: undefined, key2: undefined, key3: undefined });
    assert.deepEqual(await store.mget(['key1', 'key2', 'key3']), { key1: undefined, key2: undefined, key3: undefined });

    await store.set({ key1: 1, key2: 2, key3: 3 });
    assert.deepEqual(await store.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 });
    assert.deepEqual(await store.mget(['key1', 'key2', 'key3']), { key1: 1, key2: 2, key3: 3 });
    store.del('key1', 'key3', 'key2');
    assert.deepEqual(await store.mget('key1', 'key3', 'key2'), { key1: undefined, key2: undefined, key3: undefined });

    await store.set(['key1', 1, 'key2', 2, 'key3', 3]);
    assert.deepEqual(await store.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 });
    assert.deepEqual(await store.mget(['key1', 'key2', 'key3']), { key1: 1, key2: 2, key3: 3 });
    store.del(['key1', 'key3', 'key2']);
    assert.deepEqual(await store.mget('key1', 'key3', 'key2'), { key1: undefined, key2: undefined, key3: undefined });
  });

  it('should work with prefix', async function () {
    const store = new MemStore({ prefix: 'abc' });
    assert.deepEqual(await store.mget('key1', 'key2', 'key3'), { key1: undefined, key2: undefined, key3: undefined });

    await store.set({ key1: 1, key2: 2, key3: 3 });
    assert.deepEqual(await store.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 });
    assert(!store._data.key1);
    assert(!store._data.key2);
    assert(!store._data.key3);
    assert(!!store._data.abckey1);
    assert(!!store._data.abckey2);
    assert(!!store._data.abckey3);

    store.del(['key1', 'key3', 'key2']);
    assert.deepEqual(await store.mget('key1', 'key3', 'key2'), { key1: undefined, key2: undefined, key3: undefined });
    assert(!store._data.abckey1);
    assert(!store._data.abckey2);
    assert(!store._data.abckey3);
  });

  it('should return size when set with returnSize option', async function () {
    const store = new MemStore();
    let result = await store.set({ key1: 'a', key2: '中' });
    assert.equal(result, undefined);
    result = await store.set({ key1: 'a', key2: '中' }, { returnSize: true });
    assert.equal(result.size, 52);
  });
});
