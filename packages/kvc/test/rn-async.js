/* eslint-env mocha*/

const assert = require('assert');
const sleep = require('./helper').sleep;
const AsyncStorage = require('./helper').AsyncStorage;
const RnAsyncStore = require('../react-native-async-storage');

describe('kvc: react-native async storage', function () {
  beforeEach(async function () {
    return AsyncStorage.clear();
  });
  afterEach(async function () {
    return AsyncStorage.clear();
  });

  it('should get and set one key', async function () {
    const store = new RnAsyncStore();
    const value = await store.get('key');
    assert.strictEqual(value, undefined);

    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
  });

  it('should get and set one key with store ttl', async function () {
    const store = new RnAsyncStore({ ttl: 100 });
    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(100).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should get and set one key with key ttl', async function () {
    const store = new RnAsyncStore({ ttl: 100 });
    await store.set('key', 123, 300);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(100).then(async () => assert.strictEqual(await store.get('key'), 123));
    await sleep(300).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should del key', async function () {
    const store = new RnAsyncStore();
    await store.set('key', '123');
    assert.strictEqual(await store.get('key'), '123');
    await store.del('key');
    assert.strictEqual(await store.get('key'), undefined);
  });

  it('shoud get the keys', async function () {
    const store = new RnAsyncStore();
    store.set('key1', 1);
    store.set('key2', 2);
    assert.deepEqual(await store.keys(true), ['key1', 'key2']);
    assert.deepEqual(await store.keys('*1'), ['key1']);
    assert.deepEqual(await store.keys(/key.*/), ['key1', 'key2']);
  });

  it('should clear', async function () {
    const store = new RnAsyncStore();
    store.set('k', 1);
    await store.clear();
    assert.strictEqual(await store.get('k'), undefined);
  });

  it('should work with prefix', async function () {
    const store1 = new RnAsyncStore({ prefix: 'abc:/' });
    const store2 = new RnAsyncStore({ prefix: 'd$b' });
    const value = await store1.get('key1');
    assert.strictEqual(value, undefined);

    await store1.set({ key1: 1, key: 2 });
    await store2.set({ key2: 3, key: 4 });
    assert.deepEqual(await store1.mget('key1', 'key'), { key1: 1, key: 2 });
    assert.deepEqual(await store2.mget('key2', 'key'), { key2: 3, key: 4 });

    assert.deepEqual(await store1.keys(true), ['key1', 'key']);
    assert.deepEqual(await store2.keys(true), ['key2', 'key']);

    await store1.del('key1');
    assert.strictEqual(await store1.get('key1'), undefined);

    await store1.set('key1', 1);
    await store2.clear();
    assert.deepEqual(await store1.mget('key1', 'key'), { key1: 1, key: 2 });
    assert.deepEqual(await store2.mget('key2', 'key'), { key2: undefined, key: undefined });
  });

  it('should return size when set with returnSize option', async function () {
    const store = new RnAsyncStore();
    let result = await store.set({ key1: 'a', key2: '中' });
    assert.equal(result, undefined);
    result = await store.set({ key1: 'a', key2: '中' }, { returnSize: true });
    assert.equal(result.size, 28);
  });
});
