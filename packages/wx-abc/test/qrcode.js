/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const fibext = require('fibext');
const common = require('./common');
let wx = null;

beforeEach(() => {
  wx = common.createWxInstance();
});
describe('qrcode', () => {
  describe('temporary qrcode', () => {
    it('should throw when scene value is not valid', (done) => {
      const re = /Temporary qrcode/;
      assert.throws(() => {
        wx.qrcode.temp.create(null);
      }, re);
      assert.throws(() => {
        wx.qrcode.temp.create(0);
      }, re);
      assert.throws(() => {
        wx.qrcode.temp.create(-1);
      }, re);
      assert.throws(() => {
        wx.qrcode.temp.create(1.1);
      }, re);
      assert.throws(() => {
        wx.qrcode.temp.create('1');
      }, re);
      assert.throws(() => {
        wx.qrcode.temp.create(2147483648);
      }, re);
      done();
    });
    it('should generate a qrcode', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.qrcode.temp.create(1);
        assert(result.url);
        assert(result.image);
        assert.equal(result.expire, 604800000);
      }, done);
    });
  });
  describe('permanent qrcode', () => {
    it('should throw when scene value is not valid', (done) => {
      const re = /Permanent qrcode/;
      assert.throws(() => {
        wx.qrcode.perm.create(null);
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create(0);
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create(-1);
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create(1.1);
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create(100001);
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create('');
      }, re);
      assert.throws(() => {
        wx.qrcode.perm.create('1234567890123456789012345678901234567890123456789012345678901234567890');
      }, re);
      done();
    });
    it('should generate a qrcode with integer scene value', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.qrcode.perm.create(1);
        assert(result.url);
        assert(result.image);
        assert.equal(result.expire, 0);
      }, done);
    });
    it('should generate a qrcode with string scene value', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.qrcode.perm.create('1');
        assert(result.url);
        assert(result.image);
        assert.equal(result.expire, 0);
      }, done);
    });
  });
});
