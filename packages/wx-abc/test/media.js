/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const fibext = require('fibext');
const common = require('./common');
let wx = null;
// var openId = common.openId;

beforeEach(() => {
  wx = common.createWxInstance();
});
describe('media', () => {
  describe('temporary', () => {
    it('should create a image');
  });
  describe('permanent', () => {
    it('should count the media', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.media.perm.count();
        assert(result.image >= 0);
        assert(result.video >= 0);
        assert(result.voice >= 0);
        assert(result.news >= 0);
      }, done);
    });

    it('should list the image/voice/video media', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.media.perm.list('image', 0, 2);
        assert(result.total >= result.length);
        assert(result.length >= 0);
      }, done);
    });

    it('should list the news media', function (done) {
      this.timeout(10000);
      fibext(() => {
        const result = wx.media.perm.list('news', 0, 2);
        assert(result.total >= result.length);
        assert(result.length >= 0);
      }, done);
    });
  });
});
