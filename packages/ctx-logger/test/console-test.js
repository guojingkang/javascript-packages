/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const sandbox = require('sandboxed-module');
sandbox.registerBuiltInSourceTransformer('istanbul');

describe('console store logger', () => {
  const Logger = require('../index');

  let msgs = '';
  const fakeConsole = {
    log(msg) { msgs += msg; },
  };
  const ConsoleStore = sandbox.require('../console-store', { singleOnly: true, globals: { console: fakeConsole } });

  beforeEach(() => {
    msgs = '';
  });

  it('should print in console', () => {
    const logger = new Logger({ stores: {
      console: { class: ConsoleStore, color: false },
    } });

    const testcases = ['time a', 'this is debug log', 'this is info log', 'this is warn log', 'this is error log'];

    const now = Date.now();
    logger.time(testcases[0]);
    assert.equal(msgs, '');

    logger.debug(testcases[1]);
    let expr = `^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG ${testcases[1]}$`;
    assert(new RegExp(expr).test(msgs));
    msgs = '';

    logger.info(testcases[2]);
    expr = `^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} INFO  ${testcases[2]}$`;
    assert(new RegExp(expr).test(msgs));
    msgs = '';

    logger.warn(testcases[3]);
    expr = `^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} WARN  ${testcases[3]}$`;
    assert(new RegExp(expr).test(msgs));
    msgs = '';

    logger.error(testcases[4]);
    expr = `^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} ERROR ${testcases[4]}$`;
    assert(new RegExp(expr).test(msgs));
    msgs = '';

    logger.timeEnd('time a');
    expr = `^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} TIME  ${testcases[0]} elapsed time: ([\\.\\d]+)s`;
    const matchs = new RegExp(expr).exec(msgs);
    assert(matchs);
    const elapsed = (Date.now() - now) / 1000;
    assert(Math.abs(+matchs[1] - elapsed) < 0.005);
    msgs = '';
  });

  it('should print in console with color', () => {
    const logger = new Logger({ stores: {
      console: { class: ConsoleStore, color: true },
    } });

    logger.debug('logmsg');
    const expr = '.+?\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3} DEBUG logmsg';
    assert(new RegExp(expr).test(msgs));
    msgs = '';
  });

  it('should init with default console store', () => {
    const logger = new Logger({ stores: {
      console: { class: 'console' },
    } });

    logger.debug('logmsg');
    assert.equal(msgs, '');
    msgs = '';
  });
});
