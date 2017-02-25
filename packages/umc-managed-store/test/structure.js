/* eslint-env mocha */


const extend = require('extend');
const assert = require('assert');
const ManagedStore = require('..'),
  Types = ManagedStore.Types;

describe('structure', () => {
  describe('bad structure', () => {
    it('should throw when reference undefined entity', () => {
      let structure = { rows: Types.idArrayOf('member') };
      assert.throws(() => ManagedStore.create({ structure }), /Require entity member/);

      structure = { [Types.idOf('member')]: {} };
      assert.throws(() => ManagedStore.create({ structure }), /Require entity member/);

      structure = { rows: Types.mapOf('member', { structure: { id: Types.idOf('feed') } }) };
      assert.throws(() => ManagedStore.create({ structure }), /Require entity feed/);

      structure = { rows: Types.mapOf('member', { structure: { id: Types.anyIdOf(['feed', 'member']) } }) };
      assert.throws(() => ManagedStore.create({ structure }), /Require entity feed/);
    });
    it('should throw when redefine entity', () => {
      const structure = { rows: Types.mapOf('member'), rows2: Types.mapOf('member') };
      assert.throws(() => ManagedStore.create({ structure }), /Duplicate entity member/);
    });
    it('should ignore the extra key with a sibling typed key', () => {
      const structure = { members: Types.mapOf('member'), joined: { [Types.idOf('member')]: { b: 2 }, a: 1 } };
      const store = ManagedStore.create({ structure });
      assert.deepEqual(store.state, { members: {}, joined: {} });
      const newState = { members: { 123: { id: '123', name: 'hello' } }, joined: { 123: { c: 3 } } };
      const copyState = extend(true, {}, newState);

      store.setState(newState);
      assert.notDeepEqual(store.state, extend(true, {}, copyState, { joined: { 123: { b: 2 } }, a: 1 }));
      assert.deepEqual(store.state, extend(true, {}, copyState, { joined: { 123: { b: 2 } } }));
    });
  });
  describe('different value type', () => {
    it('should work with undefined', () => {
      const structure = { a: undefined };
      ManagedStore.create({ structure });
    });
    it('should work with null', () => {
      const structure = { a: null };
      ManagedStore.create({ structure });
    });
    it('should work with string', () => {
      const structure = { a: 'hello' };
      ManagedStore.create({ structure });
    });
    it('should work with number', () => {
      const structure = { a: 1.12 };
      ManagedStore.create({ structure });
    });
    it('should work with boolean', () => {
      const structure = { a: true };
      ManagedStore.create({ structure });
    });
    it('should work with array', () => {
      const structure = { a: [] };
      ManagedStore.create({ structure });
    });
    it('should work with object', () => {
      const structure = { a: { b: -1, c: [] } };
      ManagedStore.create({ structure });
    });
  });
});
