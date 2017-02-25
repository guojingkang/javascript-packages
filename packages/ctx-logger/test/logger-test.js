/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const sandbox = require('sandboxed-module');
sandbox.registerBuiltInSourceTransformer('istanbul');

const Logger = require('../index');

// Fake console store
let msgs = '';
const fakeConsole = {
  log(msg) { msgs += msg; },
};
const ConsoleStore = sandbox.require('../console-store', { singleOnly: true, globals: { console: fakeConsole } });

// Buffer Store
let bufMsgs = '';
function BufferStore(options) {
  Logger.Store.apply(this, arguments);
  this.messages = [];
}
require('util').inherits(BufferStore, Logger.Store);
BufferStore.prototype.addLog = function (level, message, now) {
  this.messages.push(message);
  if (this.messages.length >= 3) this.flush();
};
BufferStore.prototype.flush = function (cb) {
  const self = this;
  setTimeout(() => {
    bufMsgs = self.messages.join('\n');
    self.messages = [];
    cb && cb();
  }, 300);
};

describe('logger', () => {
  beforeEach(() => {
    msgs = '';
    bufMsgs = '';
  });

  it('should create with default console store', () => {
    let logger = new Logger();
    assert.notEqual(logger._stores.console, null);

    logger = new Logger({ stores: { console: { class: './console-store' } } });
    assert.notEqual(logger._stores.console, null);
  });


  it('should print after flush', (done) => {
    const logger = new Logger({ stores: {
      console: { class: BufferStore },
    } });
    logger.debug('logmsg');
    assert.equal(bufMsgs, '');
    logger.debug('logmsg');
    assert.equal(bufMsgs, '');
    logger.flush();
    setTimeout(() => {
      assert.equal(bufMsgs.match(/logmsg/g).length, 2);
      done();
    }, 300);
  });

  it('should auto flush when reaching the limit', (done) => {
    const logger = new Logger({ stores: {
      console: { class: BufferStore },
    } });
    logger.debug('logmsg');
    assert.equal(bufMsgs, '');
    logger.debug('logmsg');
    assert.equal(bufMsgs, '');
    logger.debug('logmsg');
    setTimeout(() => {
      assert.equal(bufMsgs.match(/logmsg/g).length, 3);
      done();
    }, 300);
  });


  it('should print with single context info', () => {
    const domain = require('domain').create();
    domain.userId = 'kiliwalk';
    domain.run(() => {
      const logger = new Logger({
        context: 'userId',
        stores: {
          console: { class: ConsoleStore, color: false },
        } });
      logger.debug('logmsg');
      const expr = '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG \\[kiliwalk\\] logmsg';
      assert(new RegExp(expr).test(msgs));
    });
  });

  it('should print with multiple context info', () => {
    const domain = require('domain').create();
    domain.userId = 'kiliwalk';
    domain.appName = 'app';
    domain.run(() => {
      let logger = new Logger({
        context: 'userId, appName',
        stores: {
          console: { class: ConsoleStore, color: false },
        } });
      logger.debug('logmsg');
      let expr = '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG \\[kiliwalk\\] \\[app\\] logmsg';
      assert(new RegExp(expr).test(msgs));

      logger = new Logger({
        context: ['userId', 'appName'],
        stores: {
          console: { class: ConsoleStore, color: false },
        } });
      logger.debug('logmsg');
      expr = '^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG \\[kiliwalk\\] \\[app\\] logmsg';
      assert(new RegExp(expr).test(msgs));
    });
  });


  it('should print with multiple stores', () => {
    let msgs1 = '';
    const fakeConsole1 = {
      log(msg) { msgs1 += msg; },
    };
    const ConsoleStore1 = sandbox.require('../console-store', { globals: { console: fakeConsole1 } });

    const logger = new Logger({ stores: {
      console: { class: ConsoleStore, bufferNum: 3 },
      console1: { class: ConsoleStore1, bufferNum: 3 },
    } });
    logger.debug('logmsg');
    const expr = '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG logmsg';
    assert(new RegExp(expr).test(msgs));
    assert(new RegExp(expr).test(msgs1));
  });

  it('should log above the threshold level', () => {
    const logger = new Logger({ stores: {
      no: {},
      file: { class: ConsoleStore, level: 'warn' },
    } });
    logger.debug('this is debug log');
    assert.equal(msgs, '');
    logger.info('this is info log');
    assert.equal(msgs, '');
    logger.warn('this is warn log');
    assert.notEqual(msgs, '');
  });

  it('should log above the threshold level after change level', () => {
    const logger = new Logger({ stores: {
      no: {},
      console: { class: ConsoleStore, level: 'warn' },
    } });
    logger.debug('this is debug log');
    assert.equal(msgs, '');
    logger.info('this is info log');
    assert.equal(msgs, '');

    logger.getStore('console').setLevel('info');
    logger.debug('this is debug log');
    assert.equal(msgs, '');
    logger.info('this is info log');
    assert.notEqual(msgs, '');
    msgs = '';
    logger.warn('this is warn log');
    assert.notEqual(msgs, '');
    msgs = '';

    logger.getStore('console').setLevel('xx');// set to debug
    logger.debug('this is debug log');
    assert.notEqual(msgs, '');
    msgs = '';


    logger.getStore('console').setLevel(100);// set to debug
    logger.debug('this is debug log');
    assert.notEqual(msgs, '');
    msgs = '';


    logger.getStore('console').setLevel(false);// set to debug
    logger.debug('this is debug log');
    assert.notEqual(msgs, '');
    msgs = '';
  });


  it('should not print without time lable', () => {
    const logger = new Logger({ stores: {
      console: { class: ConsoleStore, level: 'warn' },
    } });
    logger.time();
    logger.timeEnd();
    assert.equal(msgs, '');


    logger.timeEnd('a');
    assert.equal(msgs, '');
  });


  it('should not print with time option false', () => {
    const logger = new Logger({ stores: {
      console: { class: ConsoleStore, time: false },
    } });
    logger.time('a');
    logger.timeEnd('a');
    assert.equal(msgs, '');
  });

  it('should auto flush on process.exit', (done) => {
    const logger = new Logger({ stores: {
      console: { class: BufferStore },
    } });
    logger.debug('logmsg');
    assert.equal(bufMsgs, '');
    process.emit('SIGINT');

    setTimeout(() => {
      assert.equal(bufMsgs.match(/logmsg/g).length, 1);
      done();
    }, 300);
  });
});
