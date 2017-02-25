/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');
const _ = require('underscore');
const fibext = require('fibext');

describe('hierachical keys cache', () => {
  const Cache = require('../index');
  const Store = Cache.MemStore;
  const readkeyp = Store.readkeyp;

  it('should sync to get and set root key: /', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: 'mem', async: true }] });
      assert.strictEqual(cache.get('/'), undefined);
      cache.set('/', 'key');
      assert.strictEqual(cache.get('/'), undefined);
      cache.set('key', 'key');
      assert.strictEqual(cache.get('/'), undefined);
    }, done);
  });

  const hierKeys = [
    'dir1/dir11/dir111/file1111',
    'dir1/dir11/dir111/file1112',
    'dir1/dir11/dir111/file1113',
    'dir1/dir12/dir121/file1211',
    'dir1/file11',
    'dir2/file21',
    'dir4/dir41/file411',
  ];

  const hierKVs = {};
  hierKeys.forEach((key) => {
    const parts = key.split('/');
    let hold = hierKVs;
    for (let i = 0; i < parts.length - 1; ++i) {
      const part = parts[i];
      hold[part] || (hold[part] = {});
      hold = hold[part];
    }
    hold[parts[parts.length - 1]] = key;
  });

  it('should sync to get and set hierachical key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      assert.strictEqual(cache.mget(hierKeys), undefined);

      hierKeys.forEach((key) => {
        cache.set(key, key);
      });
      const keyPaths = readkeyp(cache._stores[0]._data, (keyPath, stats) => {
        if (stats.isContainer) return false;
        return keyPath;
      });
      assert.equal(keyPaths.length, hierKeys.length);

      assert(_.isEqual(cache.get('dir1'), hierKVs.dir1));
      assert(_.isEqual(cache.get('dir1//dir11/dir111'), hierKVs.dir1.dir11.dir111));
      assert(_.isEqual(cache.get('dir2'), hierKVs.dir2));
      assert(_.isEqual(cache.get('dir4'), hierKVs.dir4));
    }, done);
  });

  it('should async to get and set hierachical key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, async: true }] });
    cache.mgetAsync(hierKeys, (err, kvs) => {
      assert.strictEqual(kvs, undefined);

      hierKeys.forEach((key) => {
        cache.setAsync(key, key);
      });
      setTimeout(() => {
        const keyPaths = readkeyp(cache._stores[0]._data, (keyPath, stats) => {
          if (stats.isContainer) return false;
          return keyPath;
        });
        assert.equal(keyPaths.length, hierKeys.length);

        cache.getAsync('dir1', (err, value) => {
          assert(_.isEqual(value, hierKVs.dir1));
          done();
        });
      }, 1000);
    });
  });


  it('should sync to del hierachical key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, async: true }] });
      assert.strictEqual(cache.mget(hierKeys), undefined);

      const expected = {};
      hierKeys.forEach((key) => {
        cache.set(key, key);
        expected[key] = key;
      });
      assert(_.isEqual(cache.mget(hierKeys), expected));


      cache.del('dir1//notexists/dir111');
      assert(_.isEqual(cache.get('dir1//dir11/dir111'), hierKVs.dir1.dir11.dir111));

      cache.del('dir1//dir11/dir111/notexists');
      assert(_.isEqual(cache.get('dir1//dir11/dir111'), hierKVs.dir1.dir11.dir111));

      cache.del('dir1//dir11');
      assert.strictEqual(cache.get('dir1/dir11'), undefined);
      assert(_.isEqual(cache.get('dir1//dir11/dir111'), undefined));
      assert(_.isEqual(cache.get('dir1/dir12'), hierKVs.dir1.dir12));
      assert(_.isEqual(cache.get('dir2'), hierKVs.dir2));
      assert(_.isEqual(cache.get('dir4'), hierKVs.dir4));

      cache.del('dir4');
      assert(_.isEqual(cache.get('dir4'), undefined));
      assert(_.isEqual(cache.get('dir2'), hierKVs.dir2));


      hierKeys.forEach((key) => {
        cache.set(key, key);
        expected[key] = key;
      });
      cache.del(/dir1\d+/);
      assert.strictEqual(cache.get('dir1/dir11'), undefined);
      assert(_.isEqual(cache.get('dir1/dir12'), undefined));
      assert(_.isEqual(cache.get('dir1'), { file11: 'dir1/file11' }));
      assert(_.isEqual(cache.get('dir2'), hierKVs.dir2));
      assert(_.isEqual(cache.get('dir4'), hierKVs.dir4));
    }, done);
  });
});

