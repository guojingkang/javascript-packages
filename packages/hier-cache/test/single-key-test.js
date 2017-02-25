/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');
const fibext = require('fibext');

describe('single key cache', () => {
  const Cache = require('../index');
  const Store = Cache.MemStore;
  // var readkeyp = Store.readkeyp;

  it('should init cache without explicitly specify the store', () => {
    const c = new Cache();
    assert.equal(c._stores.length, 1);
  });

  it('should init cache with empty class store', () => {
    const c = new Cache({ stores: [{ class: Store, async: true }, {}] });
    assert.equal(c._stores.length, 1);
  });

  it('should init cache with string type class store', () => {
    const c = new Cache({ stores: [{ class: './mem-store', async: true }] });
    assert.equal(c._stores.length, 1);
  });

  it('should sync to get and set empty key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      assert.throws(() => {
        cache.get();
      });
      assert.throws(() => {
        cache.set();
      });
    }, done);
  });

  it('should async to get and set empty key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.getAsync('', (err) => {
      assert.notEqual(err, null);

      cache.setAsync((err) => {
        assert.notEqual(err, null);
        done();
      });
    });
  });

  it('should sync to get and set one key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      const value = cache.get('key');
      assert.strictEqual(value, undefined);

      cache.set('key', 123);
      assert.strictEqual(cache.get('key'), 123);
    }, done);
  });


  it('should async to get and set one key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.getAsync('key', (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);

      cache.setAsync('key', 123, (err) => {
        assert.equal(err, null);
        cache.getAsync('key', (err, value) => {
          assert.equal(err, null);
          assert.strictEqual(value, 123);
          done();
        });
      });
    });
  });


  it('should async to get and set undefined value', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.getAsync('key', (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);

      cache.setAsync('key', undefined, (err) => {
        assert.equal(err, null);
        cache.getAsync('key', (err, value) => {
          assert.equal(err, null);
          assert.strictEqual(value, undefined);
          done();
        });
      });
    });
  });


  it('should sync to get and set one key with store ttl', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, ttl: 300 }] });
      cache.set('key', 123);
      assert.strictEqual(cache.get('key'), 123);
      setTimeout(() => {
        cache.getAsync('key', (err, value) => {
          assert.strictEqual(value, undefined);
          done();
        });
      }, 300);
    });
  });

  it('should async to get and set one key with store ttl', (done) => {
    const cache = new Cache({ stores: [{ class: Store, ttl: 300, async: true }] });
    cache.setAsync('key', 123, (err) => {
      assert.equal(err, null);
      cache.getAsync('key', (err, value) => {
        assert.equal(err, null);
        assert.strictEqual(value, 123);
      });
      setTimeout(() => {
        cache.getAsync('key', (err, value) => {
          assert.strictEqual(value, undefined);
          done();
        });
      }, 300);
    });
  });


  it('should sync to get and set one key with key ttl', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, ttl: 300 }] });
      cache.set('key', 123, { ttl: 600 });
      assert.strictEqual(cache.get('key'), 123);
      setTimeout(() => {
        cache.getAsync('key', (err, value) => {
          assert.strictEqual(value, 123);
        });
      }, 300);
      setTimeout(() => {
        cache.getAsync('key', (err, value) => {
          assert.strictEqual(value, undefined);
          done();
        });
      }, 600);
    });
  });


  it('should async to get and set one key with key ttl', (done) => {
    const cache = new Cache({ stores: [{ class: Store, ttl: 300, async: true }] });
    cache.setAsync('key', 123, { ttl: 600 }, (err) => {
      assert.equal(err, null);
      cache.getAsync('key', (err, value) => {
        assert.equal(err, null);
        assert.strictEqual(value, 123);
      });
      setTimeout(() => {
        cache.getAsync('key', (err, value) => {
          assert.strictEqual(value, 123);
        });

        setTimeout(() => {
          cache.getAsync('key', (err, value) => {
            assert.strictEqual(value, undefined);
            done();
          });
        }, 400);
      }, 300);
    });
  });


  it('should sync to del empty key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      assert.throws(() => {
        cache.del();
      });
    }, done);
  });

  it('should async to del empty key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.delAsync('', (err) => {
      assert.notEqual(err, null);
      done();
    });
  });

  it('should sync to del single key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store }] });
      const value = cache.get('key');
      assert.strictEqual(value, undefined);
      cache.set('key', 'key');
      assert.strictEqual(cache.get('key'), 'key');
      cache.del('key');
      assert.strictEqual(cache.get('key'), undefined);
    }, done);
  });


  it('should async to del single key', (done) => {
    const cache = new Cache({ stores: [{ class: Store }] });
    cache.getAsync('key', (err, value) => {
      assert.equal(err, null);
      assert.strictEqual(value, undefined);
      cache.setAsync('key', 'key', (err) => {
        assert.equal(err, null);
        cache.getAsync('key', (err, value) => {
          assert.equal(err, null);
          assert.strictEqual(value, 'key');
          cache.delAsync('key', (err) => {
            assert.equal(err, null);
            cache.getAsync('key', (err, value) => {
              assert.strictEqual(value, undefined);
              done();
            });
          });
        });
      });
    });
  });


  it('should sync to deal with multiple stores', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }, { class: Store }] });
      assert.strictEqual(cache.get('key'), undefined);

      cache.set('key', 'key');
      assert.equal(cache._stores[0]._data.key['/'].value, 'key');
      assert.equal(cache._stores[1]._data.key['/'].value, 'key');
      assert.strictEqual(cache.get('key'), 'key');

      cache.del('key');
      assert.strictEqual(cache.get('key'), undefined);

      cache.set('key', 'key');
      cache._stores[0]._data.key = undefined;
      assert.strictEqual(cache.get('key'), 'key');
    }, done);
  });


  it('should sync to deal with error set store', (done) => {
    fibext(() => {
      function ErrorStore() {

      }
      ErrorStore.prototype.set = function (kvs, options, cb) {
        return cb(new Error('errorstore'));
      };
      const cache = new Cache({ stores: [{ class: Store, async: true }, { class: ErrorStore }] });

      assert.throws(() => {
        cache.set('key', 'key');
      }, /errorstore/);
    }, done);
  });
});
