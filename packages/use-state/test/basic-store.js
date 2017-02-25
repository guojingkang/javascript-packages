/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */

const assert = require('assert');
const Store = require('../dist/basic-store');

describe('basic store', function () {
  describe('usage', function () {
    it('should work with simple usage', async function () {
      const store = new Store();
      store.use((req) => {
        if (req.url === '/a') {
          store.setState({ path: '/a', ...req.body });
        }
      });
      await store.dispatch('/a', { key: 'value' });
      assert.deepStrictEqual(store.state, { path: '/a', key: 'value' });
    });
    it('should work with complex usage');
  });

  describe('constructor', function () {
    it('should create empty object as the default state', function () {
      const store = new Store();
      assert.deepStrictEqual(store.state, {});
    });
    it('should work with initial state', function () {
      const initialState = { count: 0 };
      const store = new Store({ state: initialState });
      assert.deepStrictEqual(store.state, initialState);
      assert.deepStrictEqual(store.state, { count: 0 });
    });
  });

  describe('setState()', function () {
    it('should set new state', function () {
      const store = new Store();
      const oldState = store.state;
      store.setState({});
      assert.deepStrictEqual(store.state, { });
      assert.notEqual(store.state, oldState);

      const newState = { count: 1 };
      store.setState(newState);
      assert.deepStrictEqual(store.state, { count: 1 });
      assert.notEqual(store.state, oldState);
      assert.strictEqual(store.state, newState);
    });
    it('should not set with non-object state', function () {
      const store = new Store();
      const oldState = store.state;
      store.setState(null);
      assert.deepStrictEqual(store.state, { });
      assert.strictEqual(store.state, oldState);
      store.setState(undefined);
      assert.deepStrictEqual(store.state, { });
      assert.strictEqual(store.state, oldState);
      store.setState(1);
      assert.deepStrictEqual(store.state, { });
      assert.strictEqual(store.state, oldState);
      store.setState('');
      assert.deepStrictEqual(store.state, { });
      assert.strictEqual(store.state, oldState);
    });
    it('should not invoke listeners when set same object even if mutated', function () {
      const state = { a: 1 };
      const store = new Store({ state });
      store.subscribe(() => {
        throw new Error('should not reach here');
      });

      store.setState(state);
      assert.equal(store.state, state);
      assert.deepStrictEqual(store.state, { a: 1 });

      state.a = 2;
      store.setState(state);
      assert.equal(store.state, state);
      assert.deepStrictEqual(store.state, { a: 2 });
    });
  });

  describe('subscribe()', function () {
    it('should invoke listeners after state changed', function (done) {
      const store = new Store({ state: { a: '' } });
      store.subscribe((newState, oldState) => {
        assert.deepStrictEqual(oldState, { a: '' });
        assert.deepStrictEqual(newState, { a: 1 });
        done();
      });
      store.setState({ a: 1 });
    });
  });

  describe('middleware', function () {
    it('should work with zero middleware', function () {
      const state = { count: 0 };
      const store = new Store({ state });
      const noChg = () => assert.equal(store.state, state) && assert.equal(store.state.count, 0);
      return store.dispatch('/').then(noChg)
        .then(() => store.dispatch('/a').then(noChg))
        .then(() => store.dispatch('/a/b').then(noChg));
    });
    it('should work with nothing-to-do middleware', function () {
      const state = { count: 0 };
      const store = new Store({ state });
      store.use(() => {});
      const noChg = () => assert.equal(store.state, state) && assert.equal(store.state.count, 0);
      return store.dispatch('/').then(noChg)
        .then(() => store.dispatch('/a').then(noChg))
        .then(() => store.dispatch('/a/b').then(noChg));
    });
    it('should expose req properties', function (done) {
      const store = new Store();
      store.use((req, resp, next) => {
        assert.strictEqual(store, req.store);
        assert.deepStrictEqual({ a: 1 }, req.body);
        assert.strictEqual('/a', req.url);
        done();
      });
      store.dispatch('/a', { a: 1 });
    });
    it('should return things from dispatch', async function () {
      const store = new Store();
      store.use(async (req, resp, next) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 1;
      });
      const result = await store.dispatch('/');
      assert.equal(result, 1);
    });

    describe('error handle', function () {
      it('should catch the downstream error', function () {
        const store = new Store();

        let error;
        store.use((req, resp, next) => next().catch(e => (error = e)));

        store.use((req, resp, next) => Promise.reject(new Error('oh wrong')));

        return store.dispatch('/').catch(() => assert(false))
        .then(() => assert.equal(error.message, 'oh wrong'));
      });
      it('should throw with not-function in use()', function () {
        const store = new Store();
        store.use();
        assert.throws(() => store.use(1), /Only accept function in use\(\)/);
      });
      it('should throw with empty url in dispatch', function () {
        const store = new Store();
        assert.throws(() => store.dispatch(), /Require url/);
      });
    });
  });
});
