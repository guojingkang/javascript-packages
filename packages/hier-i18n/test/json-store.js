/* eslint-env mocha*/
/* eslint-disable strict*/

const fs = require('fs-extra');
const assert = require('assert');
const fibext = require('fibext');

describe('json store', () => {
  const en = {
    hello: 'hello, how are you?',
    yes: 'yes, you are right',
    no: 'no, you are wrong',
    empty: '',
    'f: %s': 'format: %s',
  };
  const zhCN = {
    hello: '你好',
    yes: '是',
  };

  before(() => {
    fs.mkdirpSync('./i18n');
    fs.writeFileSync('./i18n/en.json', JSON.stringify(en));
    fs.writeFileSync('./i18n/zh-CN.json', JSON.stringify(zhCN));
  });

  after(() => {
    fs.removeSync('./i18n');
  });

  const I18N = require('../index');
  const JsonStore = require('../json-store');


  it('should transalte to right lang', (done) => {
    fibext(() => {
      const i18n = new I18N({
        stores: [
          { class: JsonStore, dir: './i18n' },
        ],
        locales: ['zh-CN', 'en'],
      });
      assert.equal(i18n.t('hello'), zhCN.hello);
      assert.equal(i18n.t('no'), en.no);
      assert.equal(i18n.t('not exists'), 'not exists');
      assert.equal(i18n.t('f: %s', 'haha'), require('util').format(en['f: %s'], 'haha'));
    }, done);
  });


  it('should refresh keys', (done) => {
    fibext(() => {
      const i18n = new I18N({
        stores: [
          { class: 'json', dir: './i18n' },
        ],
        locales: ['', 'zh-CN', 'en'],
      });
      assert.equal(i18n.t('hello'), '你好');

      zhCN.hello = '你好啊';
      fs.writeFileSync('./i18n/zh-CN.json', JSON.stringify(zhCN));
      assert.notEqual(i18n.t('hello'), zhCN.hello);
      i18n.refresh('hello', 'en');
      assert.equal(i18n.t('hello'), '你好');
      i18n.refresh('hello');
      assert.equal(i18n.t('hello'), zhCN.hello);
    }, done);
  });


  it('should run with empty options', (done) => {
    fibext(() => {
      const i18n = new I18N();
      assert.equal(i18n.t('hello'), en.hello);
      assert.equal(i18n.t('no'), en.no);
      assert.equal(i18n.t('not exists'), 'not exists');
    }, done);
  });


  it('should run with string locales', (done) => {
    fibext(() => {
      const i18n = new I18N({ locales: 'en' });
      assert.equal(i18n.t('hello'), en.hello);
      assert.equal(i18n.t('no'), en.no);
      assert.equal(i18n.t('not exists'), 'not exists');
      assert.equal(i18n.t(false), false);
    }, done);
  });


  it('should run with custom store', (done) => {
    fibext(() => {
      assert.throws(() => {
        new I18N({ stores: [{ dir: '' }, { class: 'not exists' }] });
      }, err => err.message === "Cannot find module 'not exists'");
    }, done);
  });
});
