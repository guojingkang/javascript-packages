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
describe('template message', () => {
  it('should send template message', function (done) {
    this.timeout(10000);
    fibext(() => {
      // either ok or failed if template message id not valid(not added in mp or incorrect spell)
      try {
        const result = wx.tmessage.send(openId, common.templateMessageId || 'xx', 'http://127.0.0.1/abcd',
          { first: { value: 'a' }, remark: { value: 'b' } });
        assert(/^\d+$/.test(result));
      } catch (e) {
        assert.equal(e.code, '40037');// invalid template_id
      }
    }, done);
  });
});
