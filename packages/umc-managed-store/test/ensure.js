/* eslint-env mocha */


const extend = require('extend');
const assert = require('assert');
const ManagedStore = require('..'),
  Types = ManagedStore.Types;

describe('ensure store', () => {
  describe('ensure for different value type', () => {
    it('should work with undefined', () => {
      const structure = { a: undefined };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: undefined });
    });
    it('should work with null', () => {
      const structure = { a: null };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: null });
    });
    it('should work with string', () => {
      const structure = { a: 'hello' };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: 'hello' });
    });
    it('should work with number', () => {
      const structure = { a: 1.12 };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: 1.12 });

      store.setState({ a: 0 });
      assert.deepStrictEqual(store.state, { a: 0 });
    });
    it('should work with boolean', () => {
      const structure = { a: true };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: true });

      store.setState({ a: false });
      assert.deepStrictEqual(store.state, { a: false });
    });
    it('should work with array', () => {
      let structure = { a: [] };
      let store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: [] });

      structure = { a: [1] };
      store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: [] });

      store.setState({ a: [0] });
      assert.deepStrictEqual(store.state, { a: [0] });

      store.setState({ a: [null] });
      assert.deepStrictEqual(store.state, { a: [null] });
    });
    it('should work with object', () => {
      const structure = { a: { b: -1, c: [] } };
      const store = ManagedStore.create({ structure });
      assert.deepStrictEqual(store.state, { a: { b: -1, c: [] } });
    });
  });

  describe('without ensure', () => {
    it('should keep the state', () => {
      const structure = { a: { b: 1, c: 2 } };
      const store = ManagedStore.create({ structure });
      store.setState({ a: { d: 3 } }, { ensure: false });
      assert.deepEqual(store.state, { a: { d: 3 } });
      assert.notDeepEqual(store.state, { a: { d: 3, b: 1, c: 2 } });
    });
  });

  describe('no entity structure', () => {
    let structure;
    beforeEach(() => {
      structure = { a: 1, b: { c: 2, d: 3, e: { f: 4, g: 5, h: '' } } };
    });
    it('should deep copy the structure', () => {
      const copyStruct = extend(true, {}, structure);
      const store = ManagedStore.create({ structure });

      assert.notEqual(store.state, copyStruct);
      assert.deepEqual(store.state, copyStruct);
    });
    it('should recover the deleted key', () => {
      const copyStruct = extend(true, {}, structure);
      const store = ManagedStore.create({ structure });
      store.setState({});
      assert.deepEqual(store.state, copyStruct);

      store.setState({ b: { i: 6 } });
      const result = extend(true, {}, copyStruct, { b: { i: 6 } });
      assert.deepEqual(store.state, result);
    });
  });

  describe('one entity structure', () => {
    let structure;
    beforeEach(() => {
      structure = {
        members: Types.mapOf('member', { structure: {
          type: 'user',
        } }),
        joined: Types.idArrayOf('member'),
        login: Types.idOf('member'),
      };
    });
    it('should get the right initial state', () => {
      const store = ManagedStore.create({ structure });
      assert.notEqual(store.state, structure);
      assert.deepEqual(store.state, { members: {}, joined: [], login: '' });
    });
    it('should ensure the entity structure', () => {
      const store = ManagedStore.create({ structure });

      const newState = { members: { 123: { id: '123', name: 'Mr. Tian' } } };
      store.setState(newState);
      assert.deepEqual(store.state, { members: { 123: { id: '123', name: 'Mr. Tian', type: 'user' } }, joined: [], login: '' });
    });
    it('should remove non-exist entity\'s reference', () => {
      const store = ManagedStore.create({ structure });
      assert.notEqual(store.state, structure);
      assert.deepEqual(store.state, { members: {}, joined: [], login: '' });

      const newState = { members: { 123: { id: '123', name: 'Mr. Tian' } }, joined: ['123', '234'], login: '123' };
      store.setState(newState);
      assert.notDeepEqual(store.state, newState);
      assert.deepEqual(store.state, { members: { 123: { id: '123', name: 'Mr. Tian', type: 'user' } }, joined: ['123'], login: '123' });
    });
    it('should remove duplicate id in idArray', () => {
      const store = ManagedStore.create({ structure });
      assert.notEqual(store.state, structure);
      assert.deepEqual(store.state, { members: {}, joined: [], login: '' });

      const newState = { members: { 123: { id: '123', name: 'Mr. Tian' } }, joined: ['123', '123'], login: '123' };
      store.setState(newState);
      assert.notDeepEqual(store.state, newState);
      assert.deepEqual(store.state, { members: { 123: { id: '123', name: 'Mr. Tian', type: 'user' } }, joined: ['123'], login: '123' });
    });
  });
  describe('more entity structure', () => {
    let structure;
    beforeEach(() => {
      structure = {
        as: Types.mapOf('a', { structure: {
          b: Types.idOf('b'),
        } }),
        bs: Types.mapOf('b', { structure: {
          x: Types.anyIdOf(['a', 'c']),
        } }),
        cs: Types.mapOf('c', { structure: {
          a: Types.idOf('a'),
          b: Types.idOf('b'),
        } }),
        aIds: Types.idArrayOf('a'),
        b: Types.idOf('b'),
        c: Types.idOf('c'),
      };
    });
    it('should get the right initial state', () => {
      const store = ManagedStore.create({ structure });
      assert.notEqual(store.state, structure);
      assert.deepEqual(store.state, { as: {}, bs: {}, cs: {}, aIds: [], b: '', c: '' });
    });
  });
});
