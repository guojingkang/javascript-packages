/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const af = require('after');
const fibext = require('fibext');
const common = require('./common');
const util = require('../lib/util');
let wx = null;
const openId = common.openId;

beforeEach(() => {
  wx = common.createWxInstance();
});
describe('message', () => {
  it('should check the signature and respond echostr', (done) => {
    const query = creatQuery();
    assert.equal(query.echostr, wx.message.request('GET', query));
    done();
  });

  describe('message request type', () => {
    it('should accept the text message', () => {
      const msg = createTextMessage('hello');
      wx.message.use((req, resp, next) => {
        assert.equal(req.openId, msg.FromUserName);
        assert.equal(req.instanceId, msg.ToUserName);
        assert.equal(req.instance.id, msg.ToUserName);
        assert.equal(req.created, msg.CreateTime * 1000);
        assert.equal(req.type, 'text');
        assert.equal(req.text, msg.Content);

        resp.text('welcome');
      });
      messageRequest(msg)
        .expect(/./)
        .expect('ToUserName', openId)
        .expect('FromUserName', wx.id)
        .expect('CreateTime', /^\d{10}$/)
        .expect('MsgType', 'text')
        .expect('Content', 'welcome');
    });
    it('should accept the event message', () => {
      const msg = createEventMessage('Click');
      wx.message.use((req, resp, next) => {
        assert.equal(req.openId, msg.FromUserName);
        assert.equal(req.instanceId, msg.ToUserName);
        assert.equal(req.instance.id, msg.ToUserName);
        assert.equal(req.created, msg.CreateTime * 1000);
        assert.equal(req.type, 'event');
        assert.equal(req.event, msg.Event.toLowerCase());

        resp.text('welcome');
      });
      messageRequest(msg)
        .expect(/./)
        .expect('ToUserName', openId)
        .expect('FromUserName', wx.id)
        .expect('CreateTime', /^\d{10}$/)
        .expect('MsgType', 'text')
        .expect('Content', 'welcome');
    });
  });

  describe('message response type', () => {
    it('should respond text message', () => {
      wx.message.use((req, resp, next) => {
        resp.text('welcome');
      });
      messageRequest(createTextMessage('hello'))
        .expect(/./)
        .expect('ToUserName', openId)
        .expect('FromUserName', wx.id)
        .expect('CreateTime', /^\d{10}$/)
        .expect('MsgType', 'text')
        .expect('Content', 'welcome');
    });
    it('should respond the image message');
    it('should respond the voice message');
    it('should respond the video message');
    it('should respond the music message');
    it('should respond the news message');
  });


  describe('message middleware', () => {
    it('should run with sync in middlewares', (done) => {
      const nums = [];
      wx.message.use((req, resp, next) => {
        nums.push(1);

        const fiber = fibext();
        setTimeout(() => {
          fiber.resume();
        }, 0);
        fiber.wait();

        next();
        nums.push(6);
      });
      wx.message.use((req, resp, next) => {
        nums.push(2);

        const fiber = fibext();
        setTimeout(() => {
          fiber.resume();
        }, 0);
        fiber.wait();

        next();
        nums.push(5);
      });
      wx.message.use((req, resp, next) => {
        nums.push(3);
        next();

        const fiber = fibext();
        setTimeout(() => {
          fiber.resume();
        }, 0);
        fiber.wait();

        nums.push(4);
      });
      wx.message.use((req, resp, next) => {
        resp.text('welcome');
      });
      fibext(() => {
        messageRequest(createTextMessage('hello'))
          .expect('MsgType', 'text')
          .expect('Content', 'welcome');
        assert.equal(nums.join(''), '123456');
      }, done);
    });

    it('should accept messages of different type and respond properly', () => {
      wx.message.text((req, resp, next) => {
        resp.text(`you send text ${req.text}`);
      });
      wx.message.event((req, resp, next) => {
        resp.text(`you send event ${req.event}`);
      });
      wx.message.use((req, resp, next) => {
        resp.text('welcome');
      });
      messageRequest(createTextMessage('hello'))
        .expect('MsgType', 'text')
        .expect('Content', 'you send text hello');
      messageRequest(createEventMessage('CLICK'))
        .expect('MsgType', 'text')
        .expect('Content', 'you send event click');
    });

    it('should process message across multiple middlewares', () => {
      wx.message.text((req, resp, next) => {
        req.n = 1;
        next();
      });
      wx.message.event((req, resp, next) => {
        req.n = 2;
        next();
      });
      wx.message.use((req, resp, next) => {
        resp.text(req.n);
      });
      messageRequest(createTextMessage('hello'))
        .expect('MsgType', 'text')
        .expect('Content', '1');
      messageRequest(createEventMessage('CLICK'))
        .expect('MsgType', 'text')
        .expect('Content', '2');
    });
    it('should drop the duplicated message', (done) => {
      let count = 0;
      wx.message.text((req, resp, next) => {
        req.n = ++count;
        fibext.sleep(0);
        resp.text(`${req.n}`);
      });
      const cb = af(2, done);
      const message = createTextMessage('hello');
      fibext(() => {
        messageRequest(message)
          .expect('Content', 1);
      }, cb);
      fibext(() => {
        messageRequest(message)
          .expect('');
      }, cb);
    });
  });
});

function messageRequest(message) {
  const query = creatQuery();
  let response = wx.message.request('POST', query, message);
  response = new String(response);
  response.expect = expect;
  return response;
}

function expect(k, v, cb) {
  if (arguments.length === 1) {
    compare(this, k);
    return this;
  } else {
    try {
      assert.notEqual(this, '', 'message response is empty string');
      if (!this._json) this._json = util.xml2json(this);
    } catch (e) {
      throw parseError(e, 1);
    }

    compare(this._json[k], v);
    if (cb) cb(this);
    return this;
  }
}

function compare(actual, expected) {
  try {
    if (expected instanceof RegExp) {
      assert(expected.test(actual), util.format('%s not match %s', actual, expected));
    } else if (typeof expected === 'function') {
      assert(expected(actual), util.format('%s not matched in function %s', actual, expected.name));
    } else assert.equal(actual, expected);
  } catch (e) {
    throw parseError(e);
  }
}

function parseError(e, count) {
  const stack = e.stack.split('    at ');
  stack.splice(1, count || 2);
  e.stack = stack.join('    at ');
  return e;
}

function creatQuery() {
  const query = {
    nonce: Math.random().toString(36).substr(2, 15),
    timestamp: ~~(Date.now() / 1000),
    echostr: 'hello',
  };
  query.signature = util.sha1([wx.token, query.timestamp, query.nonce].sort().join(''));
  return query;
}

function createTextMessage(content) {
  const now = ~~(Date.now() / 1000);
  const msgId = Math.random().toString().slice(2);
  const message = new String(`<xml>\
<ToUserName><![CDATA[${wx.id}]]></ToUserName>\
<FromUserName><![CDATA[${openId}]]></FromUserName> \
<CreateTime>${now}</CreateTime>\
<MsgType><![CDATA[text]]></MsgType>\
<Content><![CDATA[${content}]]></Content>\
<MsgId>${msgId}</MsgId>\
</xml>`);
  message.ToUserName = wx.id;
  message.FromUserName = openId;
  message.CreateTime = now;
  message.Content = content;
  message.MsgId = msgId;

  return message;
}

function createEventMessage(event, options) {
  options || (options = {});
  const now = ~~(Date.now() / 1000);
  let message = `<xml>\
<ToUserName><![CDATA[${wx.id}]]></ToUserName>\
<FromUserName><![CDATA[${openId}]]></FromUserName> \
<CreateTime>${now}</CreateTime>\
<MsgType><![CDATA[event]]></MsgType>\
<Event><![CDATA[${event}]]></Event>`;
  for (const kk in options) {
    message += `<${kk}><![CDATA[${options[kk]}]]></${kk}>`;
  }
  message += '</xml>';
  message = new String(message);
  message.ToUserName = wx.id;
  message.FromUserName = openId;
  message.CreateTime = now;
  message.Event = event;
  return message;
}
