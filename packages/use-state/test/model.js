/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */

const assert = require('assert');
const { Store, List, Model } = require('..');
const { clearModels } = require('../dist/structures/model');

describe('model', function () {
  afterEach(function () {
    clearModels();
  });
  describe('key', function () {
    it('should work with empty keys', function () {
      const structure = { model: Model('User') };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { model: null });
    });
    it('should work with valid key type', function () {
      const structure = { model: Model('User', { num: Number, str: String, bool: Boolean, undef: undefined, num2: 0, str2: '', bool2: false, null: null }) };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { model: null });
    });
    it('should throw with invalid key type', function () {
      assert.throws(() => new Store({ structure: { model: Model('User1', { prop: [] }) } }), /Type required of key prop in map/);
      assert.throws(() => new Store({ structure: { model: Model('User2', { prop: Date }) } }), /Invalid type Date of key prop in map/);
      assert.throws(() => new Store({ structure: { model: Model('User3', { prop: RegExp }) } }), /Invalid type RegExp of key prop in map/);
      assert.throws(() => new Store({ structure: { model: Model('User4', { prop: Buffer }) } }), /Invalid type Buffer of key prop in map/);
    });
    it('should check the key type in nested maps', function () {
      const structure = { model: Model('User', { num: Number, lvl1: { num: Number, name: String, bool: Boolean, undef: undefined } }) };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { model: null });
      assert.throws(() => new Store({ structure: { model: Model('User2', { lvl1: { prop: Date } }) } }), /Invalid type Date of key prop in map/);
    });
    it('should throw when using collection type in model key', function () {
      const structure = { model: Model('User', { num: Number, lvl1: { num: Number, name: String, bool: Boolean, undef: undefined } }) };
      const store = new Store({ structure });
      assert.deepStrictEqual(store.state.toJSON(), { model: null });
      assert.throws(() => new Store({ structure: { model: Model('User2', { lvl1: { prop: Date } }) } }), /Invalid type Date of key prop in map/);
    });
  });

  describe('.has()', function () {
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

  describe('.merge()', function () {
    it('should merge with plain object', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        assert.deepStrictEqual(newState.toJSON(), { user: null });
        const [user] = User.merge({ id: '1', name: 'tianjian' });
        newState.set('user', user);
        assert.deepStrictEqual(newState.toJSON(), { user: { id: '1', name: 'tianjian' } });
      });
    });
    it('should merge with plain objects array', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { users: List(User) } });
      store.mutate((newState) => {
        assert.deepStrictEqual(newState.toJSON(), { users: [] });
        const users = User.merge([{ id: '1', name: 'tianjian' }, { id: '2', name: 'kiliwalk' }]);
        newState.set('users', users);
        assert.deepStrictEqual(newState.toJSON(), { users: [{ id: '1', name: 'tianjian' }, { id: '2', name: 'kiliwalk' }] });
      });
    });
  });

  describe('.set()', function () {
    it('should set key value', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        let [user] = User.merge({ id: '1', name: 'tianjian' });
        user = user.set('name', 'kiliwalk');
        assert.deepStrictEqual(user.toJSON(), { id: '1', name: 'kiliwalk' });
      });
    });
    it('should set key value in keys path', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        const [user] = User.merge({ id: '1', name: 'tianjian' });
        newState.set('user', user);
        newState.set(['user', 'name'], 'kiliwalk');
        assert.deepStrictEqual(newState.toJSON(), { user: { id: '1', name: 'kiliwalk' } });
      });
    });
    it('should set value with callback', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        const [user] = User.merge({ id: '1', name: 'tianjian' });
        newState.set('user', user);
        newState.set('user', u => u.set('name', 'kiliwalk'));
        assert.deepStrictEqual(newState.toJSON(), { user: { id: '1', name: 'kiliwalk' } });
      });
    });
    it('should throw with invalid key', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        const [user] = User.merge({ id: '1', name: 'tianjian' });
        assert.throws(() => user.set(null), /Require key or keys path/);
        assert.throws(() => user.set([]), /Require key or keys path/);
        assert.throws(() => user.set([null]), /Require key or keys path/);
      });
    });
  });

  describe('.get()', function () {
    it('should get the key value', function () {
      const User = Model('User', { name: '' });
      const store = new Store({ structure: { user: User } });
      store.mutate((newState) => {
        const [user] = User.merge({ id: '1', name: 'tianjian' });
        assert.deepStrictEqual(user.get('name'), 'tianjian');
      });
    });
  });

  describe('mutation bubble', function () {
    it('should work in nested model', function () {
      const House = Model('House', { name: String });
      const User = Model('User', { name: String, house: House });

      const initialState = { user: { id: 1, name: 'a', house: { id: 1, name: '1' } } };
      const store = new Store({ structure: { user: User }, state: initialState });

      store.mutate((newState) => {
        const user = newState.get('user');
        user.set('name', 'b');

        const house = user.get('house');
        house.set('name', '2');
      });

      assert.deepStrictEqual(store.state.toJSON(), { user: { id: 1, name: 'b', house: { id: 1, name: '2' } } });
    });
    it('should work in circular relational model', function () {
      const House = Model('House', { name: String });
      const User = Model('User', { name: String, house: House });
      House.addKey('user', User);

      const user = { id: 1, name: 'a' },
        house = { id: 1, name: '1', user };
      user.house = house;
      const store = new Store({ structure: { user: User }, state: { user } });

      store.mutate((newState) => {
        const user1 = newState.get('user');
        user1.set('name', 'b');

        const house1 = user1.get('house');
        house1.set('name', '2');
      });

      const data = store.state.toJSON();
      assert.strictEqual(data.user.name, 'b');
      assert.strictEqual(data.user.house.name, '2');
    });
  });
});

