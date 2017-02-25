/* eslint-env mocha */


// const extend = require('extend');
const assert = require('assert');
const ManagedStore = require('..'),
  Types = ManagedStore.Types;

describe('save', () => {
  describe('custom save function', () => {
    let store,
      saved = null,
      structure = { as: Types.mapOf('a'), b: 'hello' };
    function save() {
      saved = Object.assign({}, this.state);
    }
    before(() => {
      store = ManagedStore.create({ structure, save });
      assert.equal(saved, null);
    });
    beforeEach(() => {
      saved = null;
    });

    it('should save', () => {
      store.setState({ b: 'world' });
      assert.deepEqual(saved, { as: {}, b: 'world' });
    });
    it('should not save with setState(..., {save: false})', () => {
      store.setState({ b: 'world' }, { save: false });
      assert.equal(saved, null);
    });
  });
  describe('save option', () => {
    let store,
      writed = null;
    function write(state) {
      writed = Object.assign({}, state);
      return { size: JSON.stringify(writed).length * 2 };
    }
    let cache = new (require('kvc/memory'))(),
      cacheKey = 'store';

    before(() => {
    });
    beforeEach(async () => {
      writed = null;
      await cache.clear();
    });
    it('should save with write option', async () => {
      const structure = { as: Types.mapOf('a'), b: 'hello' };
      store = ManagedStore.create({ structure, save: { write } });
      assert.equal(writed, null);
      store.setState({ b: 'world' });
      await sleep(100);
      assert.deepEqual(writed, { as: {}, b: 'world' });
      assert.equal(store.state.size, '42B');
    });
    it('should save with cache/cacheKey option', async () => {
      const structure = { as: Types.mapOf('a'), b: 'hello' };
      store = ManagedStore.create({ structure, save: { cache, cacheKey } });
      assert.equal(await cache.get(cacheKey), undefined);
      store.setState({ b: 'world' });
      await sleep(100);
      assert.deepEqual(await cache.get(cacheKey), { as: {}, b: 'world' });
      assert.equal(store.state.size, '62B');
    });
    it('should save with sizeKey option');
    it('should save with clearThreshold option');
    it('should save with autoClearInteval option');
    it('should save with filter option', async () => {
      const structure = { a: '1234', b: 'hello' };
      const filter = (state) => {
        const newState = Object.assign({}, state);
        delete newState.b;
        return newState;
      };
      store = ManagedStore.create({ structure, save: { cache, cacheKey, filter } });
      assert.deepEqual(store.state, { a: '1234', b: 'hello' });
      assert.equal(await cache.get(cacheKey), undefined);
      store.setState({ b: 'world' });
      await sleep(100);
      assert.deepEqual(await cache.get(cacheKey), { a: '1234' });
      assert.equal(store.state.size, '44B');
    });
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
