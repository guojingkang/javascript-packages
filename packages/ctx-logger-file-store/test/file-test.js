/* eslint-env mocha*/
/* eslint-disable strict*/

const path = require('path');
const fs = require('fs-extra');
const assert = require('assert');
const moment = require('moment');

const archiveDir = './archive-logs';

describe('file store logger', () => {
  function readLines() {
    const files = fs.readdirSync('./logs');
    if (!files || files.length <= 0) return 0;
    const logFile = path.join('./logs', files[0]);
    return fs.readFileSync(logFile, { encoding: 'utf8' }).split('\n').length - 1;
  }
  function readLines1() {
    const files = fs.readdirSync('./logs');
    if (!files || files.length <= 1) return 0;
    const logFile = path.join('./logs', files[1]);
    return fs.readFileSync(logFile, { encoding: 'utf8' }).split('\n').length - 1;
  }

  before(() => {
    fs.removeSync('./logs');
    fs.removeSync(archiveDir);
  });

  afterEach(() => {
    fs.removeSync('./logs');
    fs.removeSync(archiveDir);
  });

  it('should print with date roll', (done) => {
    assert(!fs.existsSync('./logs'), 'log dir exists before init');

    const logger = new (require('ctx-logger'))({ stores: {
      file: { class: require('../index') },
    } });
    assert(fs.existsSync('./logs'), 'log dir not exists after init');

    logger.time('time a');
    logger.debug('this is debug log');
    logger.info('this is info log');
    logger.warn('this is warn log');
    logger.error('this is error log');
    logger.timeEnd('time a');

    assert.equal(readLines(), 0);
    logger.getStore('file').addLog('debug', 'haha', moment().add(1, 'days'));
    assert.equal(readLines(), 0);
    assert.equal(readLines1(), 0);

    setTimeout(() => {
      assert.equal(readLines(), 5);
      logger.flush();
      setTimeout(() => {
        assert.equal(readLines1(), 1);
        done();
      }, 100);
    }, 100);
  });


  it('should without date roll', (done) => {
    const logger = new (require('ctx-logger'))({ stores: {
      file: { class: require('../index'), filename: 'test.%p.log' },
    } });

    logger.time('time a');
    logger.debug('this is debug log');
    logger.info('this is info log');
    logger.warn('this is warn log');
    logger.error('this is error log');
    logger.timeEnd('time a');
    assert.notEqual(readLines(), 5);

    logger.flush();
    assert.notEqual(readLines(), 5);

    setTimeout(() => {
      assert.equal(readLines(), 5);
      done();
    }, 300);
  });


  it('should archive first', (done) => {
    let logger = new (require('ctx-logger'))({ stores: {
      file: { class: require('../index') },
    } });
    logger.debug('this is debug log');
    logger.info('this is info log');

    assert.equal(readLines(), 0);
    logger.flush();
    assert.notEqual(readLines(), 2);

    setTimeout(() => {
      assert(!fs.existsSync(archiveDir), 'archive log dir exists before init');
      logger = new (require('ctx-logger'))({ stores: {
        file: new (require('../index'))({ archiveDir }),
      } });
      assert(fs.existsSync(archiveDir), 'archive log dir not exists after init');
      assert(fs.readdirSync('./logs').length <= 0);

      done();
    }, 300);
  });


  it('should should print stream error', (done) => {
    const logger = new (require('ctx-logger'))({ stores: {
      file: { class: require('../index') },
    } });
    logger.debug('1234567890123456');
    logger.getStore('file')._stream.emit('error', new Error('xxx'));
    logger.flush();
    setTimeout(done, 100);
  });

  it('should flush on process.SIGINT', (done) => {
    const logger = new (require('ctx-logger'))({ stores: {
      file: { class: require('../index') },
    } });
    const lines = 1000;// 960
    for (let i = 0; i < lines; ++i) {
      logger.debug('1234567890123456');
    }

    assert.notEqual(readLines(), lines);
    process.emit('SIGINT');

    setTimeout(() => {
      assert.equal(readLines(), lines);

      done();
    }, 300);
  });
});
