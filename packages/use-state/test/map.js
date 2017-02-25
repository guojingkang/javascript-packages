/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */

const assert = require('assert');
const { Store } = require('..');

describe('map', function () {
  describe('key', function () {
    it('should work with valid key type', function () {
      const structure = { num: Number, str: String, bool: Boolean, undef: undefined, num2: 0, str2: '', bool2: false, null: null };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { num: null, str: null, bool: null, undef: null, num2: null, str2: null, bool2: null, null: null });
    });
    it('should throw with invalid key type', function () {
      assert.throws(() => new Store({ structure: { prop: [] } }), /Type required of key prop in map/);
      assert.throws(() => new Store({ structure: { prop: Date } }), /Invalid type Date of key prop in map/);
      assert.throws(() => new Store({ structure: { prop: RegExp } }), /Invalid type RegExp of key prop in map/);
      assert.throws(() => new Store({ structure: { prop: Buffer } }), /Invalid type Buffer of key prop in map/);
    });
    it('should check the key type in nested maps', function () {
      const structure = { num: Number, lvl1: { num: Number, name: String, bool: Boolean, undef: undefined } };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { num: null, lvl1: { num: null, name: null, bool: null, undef: null } });
      assert.throws(() => new Store({ structure: { lvl1: { prop: Date } } }), /Invalid type Date of key prop in map/);
    });
  });

  describe('.keys() and .has()', function () {
    it('should return all keys when calling .keys()');
    it('should return true when key exists', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        assert(newState.has('num'));
      });
    });
    it('should return false when key not exists', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        assert(!newState.has('not exists key'));
      });
    });
  });

  describe('.validate()', function () {
    it('should not have undefined value of field');
    it('should normalize and validate String value of field');
    it('should normalize and validate Number value of field');
    it('should normalize and validate Boolean value of field');
  });

  describe('initial value', function () {
    it('should init with literal value', function () {
      const store = new Store({ structure: { num: Number }, state: { num: 1 } });
      assert.deepStrictEqual(store.state.toJSON(), { num: 1 });
      assert.strictEqual(store.state.get('num'), 1);
    });
  });

  describe('.set()', function () {
    it('should set value with one key', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        newState.set('num', 1);
        assert.deepStrictEqual(newState.toJSON(), { num: 1 });
        newState.set(['num'], 2);
        assert.deepStrictEqual(newState.toJSON(), { num: 2 });
      });
    });
    it('should set value with multiple keys', function () {
      const store = new Store({ structure: { num: Number, lvl1: { num: 0 } } });
      store.mutate((newState) => {
        newState.set(['lvl1', 'num'], 1);
        assert.deepStrictEqual(newState.toJSON(), { num: null, lvl1: { num: 1 } });
      });
    });
    it('should set value with callback', function () {
      const store = new Store({ structure: { num: Number, lvl1: { num: 0 } } });
      store.mutate((newState) => {
        newState.set('num', 1);
        newState.set(['lvl1', 'num'], 1);
        newState.set('num', value => value + 1);
        assert.deepStrictEqual(newState.toJSON(), { num: 2, lvl1: { num: 1 } });
        newState.set('lvl1', map => map.set('num', 2));
        assert.deepStrictEqual(newState.toJSON(), { num: 2, lvl1: { num: 2 } });
        newState.set(['lvl1', 'num'], value => value + 1);
        assert.deepStrictEqual(newState.toJSON(), { num: 2, lvl1: { num: 3 } });
      });
    });
    it('should throw with invalid key', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        assert.throws(() => newState.set(1), /Nonexistent key 1/);
        assert.throws(() => newState.set(null), /Require key or keys path/);
        assert.throws(() => newState.set([]), /Require key or keys path/);
        assert.throws(() => newState.set([null]), /Require key or keys path/);
      });
    });
  });

  describe('.get()', function () {
    it('should get the value with one key', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        assert.strictEqual(newState.get('num'), null);
        newState.set('num', 1);
        assert.strictEqual(newState.get('num'), 1);
        assert.strictEqual(newState.get(['num']), 1);
      });
    });
    it('should get the value with multiple keys', function () {
      const store = new Store({ structure: { num: Number, lvl1: { num: 0 } } });
      store.mutate((newState) => {
        assert.strictEqual(newState.get(['lvl1', 'num']), null);
        newState.set(['lvl1', 'num'], 1);
        assert.strictEqual(newState.get(['lvl1', 'num']), 1);
      });
    });
  });
});

