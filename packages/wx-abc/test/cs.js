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
describe('custom service and message', () => {
  it('should create a csr');
  it('should send cs text message', function (done) {
    this.timeout(10000);
    fibext(() => {
      // either ok or failed if contact out of 24-hours
      try {
        wx.cs.text(openId, 'hello');
      } catch (e) {
        assert.equal(e.code, '45015');// contact out of 24-hours
      }
    }, done);
  });
});
