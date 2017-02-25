/* eslint-env mocha*/

const assert = require('assert');
const sleep = require('./helper').sleep;
const Chain = require('..').Chain;
const AsyncStorage = require('./helper').AsyncStorage;
const RnAsyncStore = require('../react-native-async-storage');
const MemStore = require('../memory');

describe('kvc: chain', function () {
  beforeEach(async function () {
    return AsyncStorage.clear();
  });
  afterEach(async function () {
    return AsyncStorage.clear();
  });

  it('should get the value from the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    await rnStore.set('key1', 123);
    assert.strictEqual(await rnStore.get('key1'), 123);
    assert.strictEqual(await memStore.get('key1'), undefined);

    const chain = new Chain(memStore, rnStore);
    assert(!memStore._data.key1);
    assert.strictEqual(await chain.get('key1'), 123);
    assert.deepEqual(await chain.mget('key1'), { key1: 123 });
    assert.strictEqual(await memStore.get('key1'), 123);
    assert(!!memStore._data.key1);
  });

  it('should set the value to the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    const chain = new Chain(memStore, rnStore);
    await chain.set('key1', 1);
    assert(!!memStore._data.key1);
    assert.strictEqual(await chain.get('key1'), 1);
    assert.strictEqual(await memStore.get('key1'), 1);
    assert.strictEqual(await rnStore.get('key1'), 1);
  });

  it('should set the value to the chain with ttl', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    const chain = new Chain(memStore, rnStore);
    await chain.set('key1', 1, 50);
    assert.strictEqual(await chain.get('key1'), 1);
    assert.strictEqual(await memStore.get('key1'), 1);
    assert.strictEqual(await rnStore.get('key1'), 1);
    await sleep(50);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
    assert.strictEqual(await chain.get('key1'), undefined);
  });

  it('should break the ttl after join a chain', async function () {
    // so, never use this case in your code, only when you know what you get!

    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    await rnStore.set('key1', 123, 50);
    assert.strictEqual(await rnStore.get('key1'), 123);
    assert.strictEqual(await memStore.get('key1'), undefined);

    const chain = new Chain(memStore, rnStore);
    await sleep(20);
    assert.strictEqual(await chain.get('key1'), 123);
    assert(!!memStore._data.key1);
    await sleep(30);
    assert.strictEqual(await chain.get('key1'), 123);
    assert.strictEqual(await memStore.get('key1'), 123);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should del the value from the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    const chain = new Chain(memStore, rnStore);
    await chain.set('key1', 2);
    assert(!!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);

    await chain.del('key1');
    assert(!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should clear the value from the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    const chain = new Chain(memStore, rnStore);
    await chain.set('key1', 2);
    assert(!!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);

    await chain.clear();
    assert(!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should clear the value from the chain with prefix', async function () {
    let rnStore = new RnAsyncStore({ prefix: 'a.b-c:' }),
      memStore = new MemStore({ prefix: 'a.b-c2:' });
    const chain = new Chain(memStore, rnStore);
    await chain.set('key1', 2);
    assert(!!memStore._data['a.b-c2:key1']);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);

    await chain.clear();
    assert(!memStore._data['a.b-c2:key1']);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);

    await memStore.clear();
  });

  it('should work with two-memory chain', async function () {
    let store2 = new MemStore(),
      memStore = new MemStore();
    const chain = new Chain(memStore, store2);
    await chain.set('key1', 2);
    assert(!!memStore._data.key1);
    assert(!!store2._data.key1);
    assert.strictEqual(await chain.get('key1'), 2);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await store2.get('key1'), 2);

    await chain.clear();
    assert(!memStore._data.key1);
    assert(!store2._data.key1);
    assert.strictEqual(await chain.get('key1'), undefined);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await store2.get('key1'), undefined);
  });
  it('should return size when set with returnSize option', async function () {
    let store = new MemStore(),
      store2 = new RnAsyncStore();
    const chain = new Chain(store, store2);
    let result = await chain.set({ key1: 'a', key2: '中' });
    assert.equal(result, undefined);
    result = await chain.set({ key1: 'a', key2: '中' }, { returnSize: true });
    assert.equal(result.size, 52);
  });
});
