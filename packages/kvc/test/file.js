/* eslint-env mocha*/

const fs = require('fs-extra');
const assert = require('assert');
const sleep = require('./helper').sleep;
const FileStore = require('../file');

describe('kvc: file-store', function () {
  beforeEach(function () {
    fs.mkdirSync('kvcache');
  });
  afterEach(function () {
    fs.removeSync('kvcache');
  });

  it('should get and set one key', async function () {
    const store = new FileStore();
    const value = await store.get('key');
    assert.strictEqual(value, undefined);

    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
  });

  it('should get and set key which is url', async function () {
    const store = new FileStore();
    const urlKey = 'a/b-c:1.html?p=(v):2,!#e-f';
    const value = await store.get(urlKey);
    assert.strictEqual(value, undefined);

    await store.set(urlKey, 123);
    assert.strictEqual(await store.get(urlKey), 123);
  });

  it('should get and set one key with store ttl', async function () {
    const store = new FileStore({ ttl: 300 });
    await store.set('key', 123);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(300).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('should get and set one key with key ttl', async function () {
    const store = new FileStore({ ttl: 300 });
    await store.set('key', 123, 500);
    assert.strictEqual(await store.get('key'), 123);
    await sleep(300).then(async () => assert.strictEqual(await store.get('key'), 123));
    await sleep(500).then(async () => assert.strictEqual(await store.get('key'), undefined));
  });

  it('shoud get the keys');

  it('should del key', async function () {
    const store = new FileStore();
    await store.set('key', '123');
    assert.strictEqual(await store.get('key'), '123');
    await store.del('key');
    assert.strictEqual(await store.get('key'), undefined);
  });

  it('should clear', async function () {
    const store = new FileStore();
    await store.set('k', 1);
    assert.equal(fs.readdirSync('kvcache').length, 1);
    await store.clear();
    assert.equal(fs.readdirSync('kvcache').length, 0);
  });

  it('should return size when set with returnSize option', async function () {
    const store = new FileStore();
    let result = await store.set({ key1: 'a', key2: '中' });
    assert.equal(result, undefined);
    result = await store.set({ key1: 'a', key2: '中' }, { returnSize: true });
    assert.equal(result.size, 28);
  });
});
