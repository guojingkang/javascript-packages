/* eslint-env mocha*/
/* eslint no-console:0*/


const assert = require('assert');
const pd = require('..');

describe('peer check', () => {
  it('should ok when peer module exists', () => {
    assert.equal(require('./fixtures/peer-exist'), true);
  });

  it('should throw when required peer module not found ', () => {
    assert.throws(() => {
      require('./fixtures/peer-notexist');
    }, (err) => {
      assert.equal(err.message,
        'Peer module `nonexistent-peer-module` required by `peer-notexist` not found. Please run: npm install --save nonexistent-peer-module@"^1.0.0"');
      return true;
    });
  });

  it('should throw when peer module version not match in strict mode', () => {
    assert.throws(() => {
      require('./fixtures/peer-strict');
    }, err => err.message.indexOf('of peer module `semver` required by `peer-strict` does not satisfy version range "^4.1.0"') > 0);
  });

  it('should warn when peer module version not match in non-strict mode', () => {
    const oldwarn = console.warn;
    let errmsg;
    console.warn = function (msg) {
      errmsg = msg;
    };
    assert.equal(require('./fixtures/peer-notstrict'), true);
    assert(errmsg.indexOf('of peer module `semver` required by `peer-notstrict` does not satisfy version range "^4.1.0"') > 0);
    console.warn = oldwarn;
  });

  it('should throw when peer module also introduced by dependencies', () => {
    assert.throws(() => {
      require('./fixtures/peer-conflict');
    }, (err) => {
      assert.equal(err.message,
        'Peer module `semver` required by `peer-conflict` should not be introduced in dependencies part');
      return true;
    });
  });

  it('should do nothing with empty optionalPeerDependencies', () => {
    pd(module);
  });
});
