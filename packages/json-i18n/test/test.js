/* eslint-env mocha*/
/* eslint-disable strict*/

const fs = require('fs-extra');
const assert = require('assert');

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

  const I18N = require('../index');


  it('should transalte to right lang', () => {
    const i18n = new I18N({ dir: './i18n', locales: ['zh-CN', 'en', ''] });
    assert.equal(i18n.t('hello'), zhCN.hello);
    assert.equal(i18n.t('no'), en.no);
    assert.equal(i18n.t('not exists'), 'not exists');
    assert.equal(i18n.t('f: %s', 'haha'), require('util').format(en['f: %s'], 'haha'));
  });


  it('should run with empty options', () => {
    const i18n = new I18N();
    assert.equal(i18n.t('hello'), en.hello);
    assert.equal(i18n.t('no'), en.no);
    assert.equal(i18n.t('not exists'), 'not exists');
  });


  it('should run with string locales', () => {
    const i18n = new I18N({ locales: 'en' });
    assert.equal(i18n.t('hello'), en.hello);
    assert.equal(i18n.t('no'), en.no);
    assert.equal(i18n.t('not exists'), 'not exists');
    assert.equal(i18n.t(false), false);
  });

  after(() => {
    fs.removeSync('./i18n');
  });
});
