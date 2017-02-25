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
const openId = common.openId;

beforeEach(() => {
  wx = common.createWxInstance();
});
describe('oauth', () => {
  it('should create the url', () => {
    const backUrl = 'http://xx.com/wx-oauth-back';
    assert.equal(wx.oauth.url(backUrl), createUrl(backUrl));
    assert.equal(wx.oauth.url(backUrl, true), createUrl(backUrl, true));
    assert.equal(wx.oauth.url(backUrl, true, 'abcd'), createUrl(backUrl, true, 'abcd'));
  });

  it('should authorize', function (done) {
    this.timeout(5000);
    const code = 'unknown';
    fibext(() => {
      assert.throws(() => {
        wx.oauth.authorize(code);
      }, (e) => {
        assert.equal(e.code, 40029);
        return true;
      });
    }, done);
  });

  it('should get the user\'s profile', (done) => {
    const params = { openId, token: 'unknown' };
    fibext(() => {
      assert.throws(() => {
        wx.oauth.profile(params);
      }, (e) => {
        assert.equal(e.code, 40001);
        return true;
      });
    }, done);
  });
});

function createUrl(cbUrl, isBase, state) {
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${wx.appId
  }&redirect_uri=${encodeURIComponent(cbUrl)
  }&response_type=code&scope=${isBase ? 'snsapi_base' : 'snsapi_userinfo'
  }&state=${state || ''}#wechat_redirect`;
}
