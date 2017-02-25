/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');
const _ = require('underscore');
const fibext = require('fibext');

describe('multiple keys cache', () => {
  const Cache = require('../index');
  const Store = Cache.MemStore;
  // var readkeyp = Store.readkeyp;


  it('should sync to get and set empty key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      assert.throws(() => {
        cache.mget();
      });
    }, done);
  });

  it('should async to get and set empty key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.mgetAsync('', (err) => {
      assert.notEqual(err, null);

      done();
    });
  });

  it('should sync to get and set multiple key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store }] });
      assert.strictEqual(cache.mget('key1', 'key2', 'key3'), undefined);
      assert.strictEqual(cache.mget(['key1', 'key2', 'key3']), undefined);

      cache.set('key1', 1, 'key2', 2, 'key3', 3);
      assert(_.isEqual(cache.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 }));
      assert(_.isEqual(cache.mget(['key1', 'key2', 'key3']), { key1: 1, key2: 2, key3: 3 }));

      cache.set(['key1', 1, 'key2', 2, 'key3', 3]);
      assert(_.isEqual(cache.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 }));

      cache.set({ key1: 1, key2: 2, key3: 3 });
      assert(_.isEqual(cache.mget('key1', 'key2', 'key3'), { key1: 1, key2: 2, key3: 3 }));
    }, done);
  });


  it('should async to get and set multiple key with list', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.mgetAsync('key1', 'key2', 'key3', (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);

      cache.setAsync('key1', 1, 'key2', 2, 'key3', 3, (err) => {
        assert.equal(err, null);
        cache.mgetAsync('key1', 'key2', 'key3', (err, value) => {
          assert.equal(err, null);
          assert(_.isEqual(value, { key1: 1, key2: 2, key3: 3 }));
          done();
        });
      });
    });
  });

  it('should async to get and set multiple key with array', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.mgetAsync(['key1', 'key2', 'key3'], (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);

      cache.setAsync(['key1', 1, 'key2', 2, 'key3', 3], (err) => {
        assert.equal(err, null);
        cache.mgetAsync(['key1', 'key2', 'key3'], (err, value) => {
          assert.equal(err, null);
          assert(_.isEqual(value, { key1: 1, key2: 2, key3: 3 }));
          done();
        });
      });
    });
  });


  it('should async to get and set multiple key with array/map', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.mgetAsync(['key1', 'key2', 'key3'], (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);

      cache.setAsync({ key1: 1, key2: 2, key3: 3 }, (err) => {
        assert.equal(err, null);
        cache.mgetAsync(['key1', 'key2', 'key3'], (err, value) => {
          assert.equal(err, null);
          assert(_.isEqual(value, { key1: 1, key2: 2, key3: 3 }));
          done();
        });
      });
    });
  });

  it('should sync to del multiple keys', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      const value = cache.mget('key1', 'key3', 'key2');
      assert.strictEqual(value, undefined);
      cache.set('key1', 'key1', 'key2', 'key2', 'key3', 'key3');
      assert(_.isEqual(cache.mget('key1', 'key3', 'key2'), { key1: 'key1', key2: 'key2', key3: 'key3' }));
      cache.del('key1', 'key3', 'key2');
      assert.strictEqual(cache.mget('key1', 'key3', 'key2'), undefined);
    }, done);
  });


  it('should sync to deal with multiple stores', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }, { class: Store }] });
      assert.strictEqual(cache.mget('key1', 'key2', 'key3'), undefined);

      cache.set({ key1: 'key1', key2: 'key2', key3: 'key3' });
      assert.equal(cache._stores[0]._data.key1['/'].value, 'key1');
      assert.equal(cache._stores[1]._data.key1['/'].value, 'key1');
      assert.equal(cache._stores[0]._data.key2['/'].value, 'key2');
      assert.equal(cache._stores[1]._data.key2['/'].value, 'key2');
      assert.equal(cache._stores[0]._data.key3['/'].value, 'key3');
      assert.equal(cache._stores[1]._data.key3['/'].value, 'key3');
      assert(_.isEqual(cache.mget('key1', 'key2', 'key3'), { key1: 'key1', key2: 'key2', key3: 'key3' }));

      cache.del('key1', 'key2', 'key3');
      assert.strictEqual(cache.mget('key1', 'key2', 'key3'), undefined);

      cache.set({ key1: 'key1', key2: 'key2', key3: 'key3' });
      cache._stores[0]._data.key1 = undefined;
      cache._stores[0]._data.key2 = undefined;
      cache._stores[0]._data.key3 = undefined;
      cache._stores[1]._data.key1['/'].value = 'key11';
      cache._stores[1]._data.key3 = undefined;
      assert(_.isEqual(cache.mget('key1', 'key2', 'key3'), { key1: 'key11', key2: 'key2' }));
    }, done);
  });
});
