/* eslint-env mocha*/

const assert = require('assert');
require('./helper');
const util = require('../dist/util');

describe('kvc: util', function () {
  describe('#wild2re()', function () {
    it('should work with *', function () {
      const re = util.wild2re('a*a');
      assert(re.test('aa'));
      assert(re.test('a:a'));
      assert(re.test('a:ba'));
      assert(!re.test('b'));
      assert(!re.test('ab'));
    });

    it('should work with special char :', function () {
      const re = util.wild2re(':');
      assert(re.test(':'));
    });

    it('should work with special char |', function () {
      const re = util.wild2re('|');
      assert(re.test('|'));
    });

    it('should work with special char \\', function () {
      const re = util.wild2re('\\');
      assert(re.test('\\'));
    });

    it('should work with special char /', function () {
      const re = util.wild2re('/');
      assert(re.test('/'));
    });

    it('should work with special char +', function () {
      const re = util.wild2re('+');
      assert(re.test('+'));
    });

    it('should work with special char -', function () {
      const re = util.wild2re('-');
      assert(re.test('-'));
    });

    it('should work with special char ?', function () {
      const re = util.wild2re('?');
      assert(re.test('?'));
    });

    it('should work with special char (', function () {
      const re = util.wild2re('(');
      assert(re.test('('));
    });

    it('should work with special char )', function () {
      const re = util.wild2re(')');
      assert(re.test(')'));
    });

    it('should work with special char [', function () {
      const re = util.wild2re('[');
      assert(re.test('['));
    });

    it('should work with special char ]', function () {
      const re = util.wild2re(']');
      assert(re.test(']'));
    });

    it('should work with special char .', function () {
      const re = util.wild2re('.');
      assert(re.test('.'));
    });

    it('should work with special char \'', function () {
      const re = util.wild2re('\'');
      assert(re.test('\''));
    });

    it('should work with special char "', function () {
      const re = util.wild2re('"');
      assert(re.test('"'));
    });

    it('should work with special char ^', function () {
      const re = util.wild2re('^');
      assert(re.test('^'));
    });

    it('should work with special char $', function () {
      const re = util.wild2re('$');
      assert(re.test('$'));
    });
  });
});
