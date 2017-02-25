/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const assert = require('assert');
const Store = require('../dist/structure-store');

describe('structure store', function () {
  describe('constructor', function () {
    it('should work with no structure', function () {
      const store = new Store();
      assert.deepStrictEqual(store.state.toJSON(), {});
    });
    it('should work with empty object structure', function () {
      const store = new Store({ structure: {} });
      assert.deepStrictEqual(store.state.toJSON(), {});
    });
    it('should work with null/undefined structure', function () {
      let store = new Store({ structure: null });
      assert.deepStrictEqual(store.state.toJSON(), {});
      store = new Store({ structure: undefined });
      assert.deepStrictEqual(store.state.toJSON(), {});
    });
    it('should throw with unsupported structure', function () {
      assert.throws(() => new Store({ structure: 0 }), /Invalid type number of structure/);
      assert.throws(() => new Store({ structure: '' }), /Invalid type string of structure/);
      assert.throws(() => new Store({ structure: false }), /Invalid type boolean of structure/);
      assert.throws(() => new Store({ structure: Date }), /Invalid type Date of structure/);
      assert.throws(() => new Store({ structure: RegExp }), /Invalid type RegExp of structure/);
      assert.throws(() => new Store({ structure: Buffer }), /Invalid type Buffer of structure/);
      assert.throws(() => new Store({ structure: Array }), /Invalid type Array of structure/);
      assert.throws(() => new Store({ structure: [] }), /Invalid type Array of structure/);
    });
  });

  describe('setState()', function () {
    it('should throw when calling setState() explicitly', function () {
      const store = new Store();
      assert.throws(() => store.setState({ a: 1 }), /Can't call store.setState\(\) directly/);
    });
    it('should throw when calling setState() inside store.mutate()', function (done) {
      const store = new Store();
      store.mutate((newState) => {
        assert.throws(() => store.setState(), /Can't call store.setState\(\) directly/);
        done();
      });
    });
  });

  describe('mutate()', function () {
    it('should throw when calling mutate() without callback', function () {
      const store = new Store();
      assert.throws(() => store.mutate(), /Require callback function in store.mutate\(\)/);
      assert.throws(() => store.mutate(1), /Require callback function in store.mutate\(\)/);
    });
    it('should throw when calling mutate() nested', function (done) {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        assert.throws(() => store.mutate(), /Can't open another mutation operation/);
        done();
      });
    });
    it('should throw when mutating outside store.mutate()', function (done) {
      const store = new Store({ structure: { num: Number } });
      assert.throws(() => store.state.set('num', 1), /Can't change the state outside store.mutate\(\)/);
      store.mutate((newState) => {
        setTimeout(() => {
          assert.throws(() => store.state.set('num', 1), /Can't change the state outside store.mutate\(\)/);
          done();
        });
      });
    });
    it('should not create another new state when mutating', function () {
      const store = new Store({ structure: { num: Number } });
      store.mutate((newState) => {
        const newState2 = newState.set('num', 1);
        assert.equal(newState2, newState);
        assert.deepStrictEqual(newState2.toJSON(), { num: 1 });
      });
    });
  });
});

