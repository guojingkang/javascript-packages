/* eslint-env mocha */


const assert = require('assert');
const umc = require('../lib/index');

describe('basic', () => {
  it('should not change the store without any middlewares', () => {
    const initialState = { count: 0 };
    const store = umc(initialState);
    const noChg = () => assert.equal(store.state, initialState) && assert.equal(store.state.count, 1);
    return store.dispatch('/').then(noChg)
      .then(() => store.dispatch('/a')).then(noChg)
      .then(() => store.dispatch('/a/b')).then(noChg);
  });

  it('should not change the store with nothing-to-do middleware', () => {
    const initialState = { count: 0 };
    const store = umc(initialState);
    store.use(() => {});
    const noChg = () => assert.equal(store.state, initialState) && assert.equal(store.state.count, 0);
    return store.dispatch('/').then(noChg)
      .then(() => store.dispatch('/a')).then(noChg)
      .then(() => store.dispatch('/a/b')).then(noChg);
  });

  it('should change the store', () => {
    const initialState = { url: '' };
    const store = umc(initialState);
    store.use((req, resp, next) => resp.send({ url: req.url }));
    let lastState = initialState;
    return store.dispatch('/')
      .then(() => {
        assert.notEqual(store.state, lastState), (lastState = store.state), assert.equal(store.state.url, '/');
      })
      .then(() => store.dispatch('/a'))
      .then(() => {
        assert.notEqual(store.state, lastState), (lastState = store.state), assert.equal(store.state.url, '/a');
      })
      .then(() => store.dispatch('/a/b'))
      .then(() => {
        assert.notEqual(store.state, lastState), (lastState = store.state), assert.equal(store.state.url, '/a/b');
      });
  });

  it('should catch the error', () => {
    const store = umc();

    let error;
    store.use((req, resp, next) => next().catch(e => (error = e)));

    store.use((req, resp, next) => Promise.reject(new Error('oh wrong')));

    return store.dispatch('/').catch(() => assert(false))
    .then(() => assert.equal(error.message, 'oh wrong'));
  });

  it('should throw with not-function in use()', () => {
    const store = umc();
    store.use();
    assert.throws(() => store.use(1), TypeError);
  });

  it('should throw with empty url in dispatch', () => {
    const store = umc();
    assert.throws(() => store.dispatch(), 'url required');
  });

  it('should subscribe the state changed', (done) => {
    const store = umc({ a: '' });
    store.use((req, resp, next) => {
      store.setState({ a: '1' });
    });
    store.subscribe((newState, oldState) => {
      assert.equal(oldState.a, '');
      assert.equal(newState.a, '1');
      done();
    });
    store.dispatch('/');
  });
});
