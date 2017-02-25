/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */

const isPlainObject = require('lodash.isplainobject');
const assert = require('assert');
const { Store, Model, List } = require('..');
const { clearModels } = require('../dist/structures/model');

describe('immutable data', function () {
  afterEach(function () {
    clearModels();
  });
  describe.skip('usage', function () {
    it('should not change state with nothing-to-do in mutate()', function () {
      const User = Model('User', {
        name: String,
      });
      const House = Model('House', {
        user: User,
        value: Number,
      });
      User.addKey({ houses: List(House) });

      const structure = { users: List(User), loginUser: User, houses: List(House) };
      const store = new Store({ structure });
      store.mutate((newState) => {
        const users = User.merge([{ id: 1, name: 'tianjian' }, { id: 2, name: 'kiliwalk' }]);
        const houses = House.merge([{ id: 1, value: 1, user: users[0] }, { id: 2, value: 2, user: users[1] }]);
        users[0].set('houses', [houses[0]]);
        users[1].set('houses', [houses[1]]);

        newState.set('users', users);
        newState.set('houses', houses);
        newState.set('loginUser', users[0]);
      });
      const state1 = store.state,
        json1 = state1.toJSON();
      console.log(require('util').inspect(json1, { depth: 4 }));
      // assert.deepStrictEqual(json1, {
      //   users: [{ id: 1, name: 'tianjian' }, { id: 2, name: 'kiliwalk' }],
      //   houses: [{ id: 1, value: 1, userId: 1 }, { id: 2, value: 2, userId: 2 }],
      //   loginUser: { id: 1, name: 'tianjian' } });
    });
  });

  describe('basic', function () {
    it('should not change state with nothing-to-do in mutate()', function () {
      const store = new Store();
      const prevState = store.state,
        prevJSON = store.state.toJSON();
      assert.deepStrictEqual(prevJSON, {});

      store.mutate((newState) => {
        assert.deepStrictEqual(prevJSON, {});

        assert.notEqual(newState, prevState);
        assert.equal(store.state, prevState);

        assert.equal(newState.toJSON(), prevJSON);
        assert.equal(store.state.toJSON(), prevJSON);
      });

      assert.equal(store.state, prevState);

      assert.equal(store.state.toJSON(), prevJSON);
      assert.deepStrictEqual(prevJSON, {});
    });
    it('should not change old state while mutating', function () {
      const store = new Store({ structure: { num: 0 } });
      const prevState = store.state,
        prevJSON = store.state.toJSON();

      store.mutate((newState) => {
        newState.set('num', 1);

        assert.notEqual(newState.toJSON(), prevJSON);
        assert.deepStrictEqual(newState.toJSON(), { num: 1 });
        assert.deepStrictEqual(prevJSON, { num: null });
        assert.equal(prevState.toJSON(), prevJSON);
        assert.equal(store.state.toJSON(), prevJSON);
      });
    });
    it('should not change state when error occurred', function () {
      const store = new Store({ structure: { num: Number } });
      const prevJSON = store.state.toJSON(),
        prevState = store.state;

      assert.throws(() => store.mutate((newState) => {
        newState.set('num', 1);
        throw new Error('1234');
      }), /1234/);

      assert.equal(store.state, prevState);
      assert.equal(store.state.toJSON(), prevJSON);
    });
    it('should change state even with non-sense mutation', function () {
      const store = new Store({ structure: { num: Number } });
      const prevState = store.state,
        prevJSON = prevState.toJSON();

      store.mutate((newState) => {
        newState.set('num', 1);
        newState.set('num', null);

        assert.notEqual(newState, store.state);
      });

      assert.notEqual(store.state, prevState);
      assert.notEqual(store.state.toJSON(), prevJSON);
      assert.deepStrictEqual(store.state.toJSON(), prevJSON);
      assert.deepStrictEqual(prevJSON, { num: null });
    });
  });

  describe('map', function () {
    it('should work in a simple map', function () {
      const store = new Store({ structure: { str: String } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set('str', 'a');
      });

      checkImmutable(store.state, prevState, { str: true });
    });
    it('should work in nested maps', function () {
      const store = new Store({ structure: { num: Number, lvl1: { str: String } } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['lvl1', 'str'], 'a');
      });

      checkImmutable(store.state, prevState, { lvl1: { str: true } });
    });
  });

  describe('list', function () {
    it('should work in a simple list', function () {
      const store = new Store({ structure: { nums: List(Number) }, state: { nums: [1, 2] } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['nums', '0'], '3');
      });

      checkImmutable(store.state, prevState, { nums: { 0: true } });
    });
  });

  describe('model', function () {
    it('should work with a simple model', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User }, state: { user: { id: 1, name: 'a' } } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['user', 'name'], 'b');
      });
      checkImmutable(store.state, prevState, { user: { name: true } });
    });
    it('should work with model in list', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { users: List(User) }, state: { users: [{ id: 1, name: 'a' }] } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['users', 0, 'name'], 'b');
      });
      checkImmutable(store.state, prevState, { users: { 0: { name: true } } });
    });
    it('should work with nested models', function () {
      const User = Model('User', { name: '' });
      const House = Model('House', { name: '', user: User });

      const user = { id: 1, name: 'a' },
        house = { id: 1, name: 'A' };
      house.user = user;

      const store = new Store({ structure: { house: House }, state: { house } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['house', 'name'], 'B');
      });
      checkImmutable(store.state, prevState, { house: { name: true } });

      const prevState2 = store.state;
      store.mutate((newState) => {
        newState.set(['house', 'user', 'name'], 'b');
      });
      checkImmutable(store.state, prevState2, { house: { user: { name: true } } });
    });
    it('should work with circular-reference records', function () {
      const User = Model('User', { name: '' });
      const House = Model('House', { name: '', user: User });
      User.addKey('houses', List(House));

      const user = { id: 1, name: 'a' },
        house = { id: 1, name: 'A' };
      user.houses = [house];
      house.user = user;

      const store = new Store({ structure: { user: User, houses: List(House) }, state: { user, houses: [house] } });
      const prevState = store.state;

      store.mutate((newState) => {
        newState.set(['user', 'name'], 'b');
      });
      checkImmutable(store.state, prevState, { user: { name: true, houses: true }, houses: true });
    });
  });
});

function checkImmutable(oldState, newState, changedKeysMap) {
  shouldImmutable([], newState, oldState, changedKeysMap);
}

function shouldImmutable(keysPath, oldState, newState, changedKeysMap) {
  const sKeysPath = keysPath.length > 0 ? `.${keysPath.join('.')}` : '';
  assert.notEqual(newState, oldState, `state${sKeysPath} should be changed`);
  const newJSON = toJSON(newState),
    oldJSON = toJSON(oldState);
  assert.notEqual(newJSON, oldJSON, `json${sKeysPath} should be changed`);
  if (!isPlainObject(changedKeysMap)) return;

  const keys = newState.keys();
  keys.forEach((key) => {
    const subNewState = newState.get(key),
      subOldState = oldState.get(key);
    const subKeysPath = [...keysPath, key];

    if (changedKeysMap[key]) { // changed
      shouldImmutable(subKeysPath, subNewState, subOldState, changedKeysMap[key]);
    } else {
      const subNewJSON = toJSON(subNewState),
        subOldJSON = toJSON(subOldState);
      const sSubKeysPath = subKeysPath.length > 0 ? `.${subKeysPath.join('.')}` : '';

      assert.strictEqual(subNewState, subOldState, `state${sSubKeysPath} should not be changed`);
      assert.strictEqual(subNewJSON, subOldJSON, `json${sSubKeysPath} should not be changed`);
    }
  });
}

function toJSON(state) {
  if (!state) return state;
  const type = typeof state;
  if (type === 'number' || type === 'string' || type === 'boolean') return state;
  return state.toJSON();
}
