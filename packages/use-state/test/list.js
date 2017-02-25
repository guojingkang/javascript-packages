/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */

const assert = require('assert');
const { Store, List } = require('..');

describe('list', function () {
  describe('element type', function () {
    it('should work without specified element type', function () {
      const store = new Store({ structure: { list: List() } });
      assert.deepStrictEqual(store.state.toJSON(), { list: [] });
    });
    it('should work with supported type', function () {
      const structure = { nums: List(Number), strs: List(String), bools: List(Boolean), undefs: List(undefined), nums2: List(0), strs2: List(''), bools2: List(false), nulls: List(null) };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { nums: [], strs: [], bools: [], undefs: [], nums2: [], strs2: [], bools2: [], nulls: [] });
    });
    it('should throw invalid type when using unsupported type', function () {
      assert.throws(() => new Store({ structure: { list: List(Date) } }), /Invalid element type Date in list/);
      assert.throws(() => new Store({ structure: { list: List(RegExp) } }), /Invalid element type RegExp in list/);
      assert.throws(() => new Store({ structure: { list: List(Buffer) } }), /Invalid element type Buffer in list/);
    });
  });
  describe('.keys() and .has()', function () {
    it('should return all keys when calling .keys()');
    it('should return true when key is number', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        const list = newState.get('list');
        assert(list.has(0));
        assert(list.has(1));
        assert(list.has('0'));
        assert(list.has('1'));
      });
    });
    it('should return false when key is not number', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        const list = newState.get('list');
        assert(!list.has(''));
        assert(!list.has(false));
        assert(!list.has({}));
      });
    });
    it('should return false when key is less than -length', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        const list = newState.get('list');
        assert(!list.has(-1));
        assert(!list.has('-1'));
      });
    });
  });

  describe('.set()', function () {
    it('should set value with positive key', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        assert.deepStrictEqual(newState.toJSON(), { list: [] });
        newState.set(['list', 0], 1);
        assert.deepStrictEqual(newState.toJSON(), { list: [1] });
        newState.set(['list', 0], 2);
        assert.deepStrictEqual(newState.toJSON(), { list: [2] });
      });
    });
    it('should set value with negative key', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        newState.set(['list', 0], 1);
        assert.deepStrictEqual(newState.toJSON(), { list: [1] });
        newState.set(['list', -1], 2);
        assert.deepStrictEqual(newState.toJSON(), { list: [2] });
      });
    });
    it('should set value with callback', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        newState.set('list', list => list.set(0, 1));
        assert.deepStrictEqual(newState.toJSON(), { list: [1] });
      });
    });
    it('should throw with invalid key', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        const list = newState.get('list');
        assert.throws(() => list.set(null), /Require key or keys path/);
        assert.throws(() => list.set([]), /Require key or keys path/);
        assert.throws(() => list.set([null]), /Require key or keys path/);
      });
    });
  });

  describe('.get()', function () {
    it('should get the value with positive key', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        assert.strictEqual(newState.get(['list', 0]), null);
        newState.set(['list', 0], 1);
        assert.strictEqual(newState.get(['list', 0]), 1);
      });
    });
    it('should get the value with negative key', function () {
      const store = new Store({ structure: { list: List() } });
      store.mutate((newState) => {
        newState.set(['list', 0], 1);
        assert.strictEqual(newState.get(['list', -1]), 1);
      });
    });
  });
});

