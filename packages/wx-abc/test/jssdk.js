/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
// var request = require('supertest');
// var af = require('after');
// var qs = require('querystring');
const fibext = require('fibext');
const common = require('./common');
// var util = require('../lib/util');
let wx = null;
// var openId = common.openId;

beforeEach(() => {
  wx = common.createWxInstance();
  wx._cache.flushAll();
});
describe('jssdk', () => {
  it('should retrieve the ticket from weixin server', function (done) {
    this.timeout(8000);
    fibext(() => {
      let cacheKey = `weixin-js-api-ticket/${wx.id}`,
        cache = wx._cache;
      assert.equal(cache.get(cacheKey), undefined);
      const ticket = wx.jssdk._getTicket();
      assert(ticket);
      assert.equal(cache.get(cacheKey), ticket);
    }, done);
  });

  it('should retrieve the ticket from the inner cache', function (done) {
    this.timeout(15000);
    fibext(() => {
      let cacheKey = `weixin-js-api-ticket/${wx.id}`,
        cache = wx._cache;
      assert.equal(cache.get(cacheKey), undefined);
      const ticket = wx.jssdk._getTicket();
      assert(ticket);

      assert.equal(cache.get(cacheKey), ticket);
      fibext.sleep(300);
      assert.equal(ticket, wx.jssdk._getTicket());

      cache.set(cacheKey, '');
      assert.equal(cache.get(cacheKey), '');
      const ticket2 = wx.jssdk._getTicket();
      assert(ticket2);
      assert.equal(ticket, ticket2);
    }, done);
  });

  it('should prepare jssdk', function (done) {
    this.timeout(5000);
    fibext(() => {
      const result = wx.jssdk.prepare();
      assert(result);
      assert(result.appId, wx.appId);
      assert(result.nonceStr);
      assert(result.timestamp);
      assert(result.sign);
    }, done);
  });
});
