/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const fs = require('fs-extra');
const KVCM = require('kv-cache-manager');
const fibext = require('fibext');
const common = require('./common');
let wx = null;

beforeEach(() => {
  wx = common.createWxInstance();
  wx._cache.flushAll();
});
describe('instance', () => {
  it('should retrieve the token from weixin server', (done) => {
    fibext(() => {
      let cacheKey = `weixin-access-token/${wx.id}`,
        cache = wx._cache;
      assert.equal(cache.get(cacheKey), undefined);
      const token = wx.getAccessToken();
      assert(token);
      assert.equal(cache.get(cacheKey), token);
    }, done);
  });

  it('should retrieve the token from the inner cache', function (done) {
    this.timeout(10000);
    fibext(() => {
      let cacheKey = `weixin-access-token/${wx.id}`,
        cache = wx._cache;
      assert.equal(cache.get(cacheKey), undefined);
      const token = wx.getAccessToken();
      assert(token);

      assert.equal(cache.get(cacheKey), token);
      fibext.sleep(300);
      assert.equal(token, wx.getAccessToken());

      cache.set(cacheKey, '');
      const token2 = wx.getAccessToken();
      assert(token2);
      assert.notEqual(token, token2);
    }, done);
  });

  it('should retrieve the token from the specified cache', function (done) {
    this.timeout(10000);
    fibext(() => {
      const cacheKey = `weixin-access-token/${wx.id}`;
      const cache = new KVCM.MemoryStore();
      const weixin = common.createWxInstance({ cache });
      const token = weixin.getAccessToken();
      assert(token);

      assert.equal(cache.get(cacheKey), token);
      fibext.sleep(300);
      assert.equal(token, weixin.getAccessToken());

      cache.set(cacheKey, '');
      const token2 = weixin.getAccessToken();
      assert(token2);
      assert.notEqual(token, token2);
    }, done);
  });

  it('should retrieve the token from the specified cache 2', function (done) {
    this.timeout(10000);
    fibext(() => {
      const cacheKey = `weixin-access-token/${wx.id}`;
      const cache = new KVCM.FileStore({ dir: 'kvcache' });
      const weixin = common.createWxInstance({ cache });
      const token = weixin.getAccessToken();
      assert(token);

      assert.equal(cache.get(cacheKey), token);
      fibext.sleep(300);
      assert.equal(token, weixin.getAccessToken());

      cache.set(cacheKey, '');
      const token2 = weixin.getAccessToken();
      assert(token2);
      assert.notEqual(token, token2);
    }, done);
  });
  after(() => {
    fs.removeSync('kvcache');
  });
});
