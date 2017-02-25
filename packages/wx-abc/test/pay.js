/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const fibext = require('fibext');
const common = require('./common');
let wx = null;
const openId = common.openId;

beforeEach(() => {
  wx = common.createWxInstance();
});
describe('pay', () => {
  it('should prepay', function (done) {
    this.timeout(10000);
    fibext(() => {
      const tradeNo = Math.random().toString().slice(2);
      const notifyUrl = 'http://xxx.com/wxpay-notify';
      const result = wx.pay.prepay({ openId, tradeNo, amount: 100,
        desc: '测试', notifyUrl });
      assert(result);
      assert.equal(result.appId, wx.appId);
      assert(result.nonceStr);
      assert.equal(result.signType, 'MD5');
      assert(result.timestamp);
      assert(result.timeStamp);
      assert(/prepay_id=.+/.test(result.package));
    }, done);
  });

  it('should parse the weixin pay notify and show sign invalid', function (done) {
    this.timeout(10000);
    fibext(() => {
      assert.throws(() => {
        wx.pay.notify(createNotifyMessage());
      }, e => e.message === 'invalid sign of weixin pay notification');
      // assert(result);
      // assert.equal(result.tradeNo, '1409811653');
      // assert(result.amount, 1);
      // assert(result.transactionId);
      // assert(result.attach, '');
    }, done);
  });

  it('should send red packet', function (done) {
    this.timeout(10000);

    // either ok or failed if account balance is insufficient
    fibext(() => {
      const tradeNo = Math.random().toString().slice(2);
      const result = wx.pay.sendRedPacket({ openId, tradeNo, amount: 100,
        name: 'kiliwalk', wish: 'happy day', activity: 'free activity', remark: 'more',
        ip: '127.0.0.1',
      });
      assert(result);
      assert.equal(result.tradeNo, tradeNo);
      assert(result.transactionId);
    }, (err) => {
      if (err) assert(err.message.indexOf('帐号余额不足') >= 0);
      done();
    });
  });
});

function createNotifyMessage() {
  const xml = '<xml>\
  <appid><![CDATA[wx2421b1c4370ec43b]]></appid>\
  <attach><![CDATA[支付测试]]></attach>\
  <bank_type><![CDATA[CFT]]></bank_type>\
  <fee_type><![CDATA[CNY]]></fee_type>\
  <is_subscribe><![CDATA[Y]]></is_subscribe>\
  <mch_id><![CDATA[10000100]]></mch_id>\
  <nonce_str><![CDATA[5d2b6c2a8db53831f7eda20af46e531c]]></nonce_str>\
  <openid><![CDATA[oUpF8uMEb4qRXf22hE3X68TekukE]]></openid>\
  <out_trade_no><![CDATA[1409811653]]></out_trade_no>\
  <result_code><![CDATA[SUCCESS]]></result_code>\
  <return_code><![CDATA[SUCCESS]]></return_code>\
  <sign><![CDATA[B552ED6B279343CB493C5DD0D78AB241]]></sign>\
  <sub_mch_id><![CDATA[10000100]]></sub_mch_id>\
  <time_end><![CDATA[20140903131540]]></time_end>\
  <total_fee>1</total_fee>\
  <trade_type><![CDATA[JSAPI]]></trade_type>\
  <transaction_id><![CDATA[1004400740201409030005092168]]></transaction_id>\
</xml>';
  return xml;
}
