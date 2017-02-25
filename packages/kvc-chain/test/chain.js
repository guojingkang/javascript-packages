/* eslint-env mocha*/

const assert = require('assert');
const sleep = require('./helper').sleep;
const AsyncStorage = require('./helper').AsyncStorage;
const RnAsyncStore = require('../react-native-async-storage');
const MemStore = require('../memory');

describe('chain', function () {
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

    memStore.chain(rnStore);
    assert(!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 123);
    assert(!!memStore._data.key1);
  });

  it('should set the value to the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    memStore.chain(rnStore);
    await memStore.set('key1', 1);
    assert(!!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 1);
    assert.strictEqual(await rnStore.get('key1'), 1);
  });

  it('should set the value to the chain with ttl', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    memStore.chain(rnStore);
    await memStore.set('key1', 1, 50);
    assert.strictEqual(await memStore.get('key1'), 1);
    assert.strictEqual(await rnStore.get('key1'), 1);
    await sleep(50);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should get the value from the chain with ttl', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    await rnStore.set('key1', 123, 50);
    assert.strictEqual(await rnStore.get('key1'), 123);
    assert.strictEqual(await memStore.get('key1'), undefined);

    memStore.chain(rnStore);
    await sleep(20);
    assert.strictEqual(await memStore.get('key1'), 123);
    assert(!!memStore._data.key1);
    await sleep(30);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should del the value from the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    memStore.chain(rnStore);
    await memStore.set('key1', 2);
    assert(!!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);

    await memStore.del('key1');
    assert(!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should clear the value from the chain', async function () {
    let rnStore = new RnAsyncStore(),
      memStore = new MemStore();
    memStore.chain(rnStore);
    await memStore.set('key1', 2);
    assert(!!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);

    await memStore.clear();
    assert(!memStore._data.key1);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
  });

  it('should chain with same prefix', async function () {
    let rnStore = new RnAsyncStore({ prefix: 'a.b-c:' }),
      memStore = new MemStore({ prefix: 'a.b-c:2' });
    assert.throws(() => memStore.chain(rnStore), err => err.message.indexOf('same prefix') > 0);
  });

  it('should clear the value from the chain with prefix', async function () {
    let rnStore = new RnAsyncStore({ prefix: 'a.b-c:' }),
      memStore = new MemStore({ prefix: 'a.b-c:' });
    const rnStore2 = new RnAsyncStore({ prefix: 'a.b-c2:' });
    memStore.chain(rnStore);
    await memStore.set('key1', 2);
    await rnStore2.set('key1', 3);
    assert(!!memStore._data['a.b-c:key1']);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await rnStore.get('key1'), 2);
    assert.strictEqual(await rnStore2.get('key1'), 3);

    await memStore.clear();
    assert(!memStore._data['a.b-c:key1']);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await rnStore.get('key1'), undefined);
    assert.strictEqual(await rnStore2.get('key1'), 3);

    await memStore.clear();
  });

  it('should work with two-memory chain', async function () {
    let store2 = new MemStore(),
      memStore = new MemStore();
    memStore.chain(store2);
    await memStore.set('key1', 2);
    assert(!!memStore._data.key1);
    assert(!!store2._data.key1);
    assert.strictEqual(await memStore.get('key1'), 2);
    assert.strictEqual(await store2.get('key1'), 2);

    await memStore.clear();
    assert(!memStore._data.key1);
    assert(!store2._data.key1);
    assert.strictEqual(await memStore.get('key1'), undefined);
    assert.strictEqual(await store2.get('key1'), undefined);
  });
  it('should return size when set with returnSize option', async function () {
    let store = new MemStore(),
      store2 = new RnAsyncStore();
    store.chain(store2);
    let result = await store.set({ key1: 'a', key2: '中' });
    assert.equal(result, undefined);
    result = await store.set({ key1: 'a', key2: '中' }, { returnSize: true });
    assert.equal(result.size, 28);
  });
});
