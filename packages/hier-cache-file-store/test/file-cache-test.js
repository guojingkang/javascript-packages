/* eslint-env mocha*/
/* eslint-disable strict*/

const fs = require('fs-extra');
const assert = require('assert');
const _ = require('underscore');
const fibext = require('fibext');
const readdirpSync = require('fs-readdirp').readdirpSync;
const readdirp = require('fs-readdirp').readdirp;

describe('cache-file-store', () => {
  afterEach(() => {
    fs.removeSync('./cache');
  });

  const Cache = require('hier-cache');
  const Store = require('../index');

  it('init cache without store', () => {
    const c = new Cache();
    assert.equal(c._stores.length, 1);
  });

  it('sync to get and set one key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
      const value = cache.get('key');
      assert.strictEqual(value, undefined);

      cache.set('key', 123);
      assert.strictEqual(cache.get('key'), 123);
      done();
    });
  });


  it('async to get and set one key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
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


  it('async to get and set undefined value', (done) => {
    const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
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


  it('sync to get and set one key with store ttl', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache', ttl: 300 }] });
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

  it('sync to get and set one key with key ttl', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache', ttl: 300 }] });
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


  it('should sync to get and set root key: /', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
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
  it('sync to get and set hierachical key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
      assert.strictEqual(cache.mget(hierKeys), undefined);

      hierKeys.forEach((key) => {
        cache.set(key, key);
      });
      const files = readdirpSync('./cache', (file, stats) => {
        if (stats.isDirectory()) return false;
      });
      assert.equal(hierKeys.length, files.length);

      assert(_.isEqual(cache.get('dir1'), hierKVs.dir1));
      assert(_.isEqual(cache.get('dir1/dir11'), hierKVs.dir1.dir11));
      assert(_.isEqual(cache.get('dir2'), hierKVs.dir2));
      assert(_.isEqual(cache.get('dir4'), hierKVs.dir4));

      done();
    });
  });

  it('async to get and set hierachical key', (done) => {
    const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
    cache.mgetAsync(hierKeys, (err, kvs) => {
      assert.strictEqual(kvs, undefined);

      hierKeys.forEach((key) => {
        cache.setAsync(key, key);
      });
      setTimeout(() => {
        readdirp('./cache', (file, stats, cb) => {
          if (stats.isDirectory()) return cb(null, false);
          cb(null, file);
        }, (err, files) => {
          assert.equal(err, null);
          assert.equal(hierKeys.length, files.length);

          done();
        });
      }, 1000);
    });
  });

  it('sync to override dir key and file key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
      assert.strictEqual(cache.get('dir1/dir12/file121'), undefined);

      cache.set('dir1/dir12/file121', 123);
      assert.strictEqual(cache.get('dir1/dir12/file121'), 123);
      cache.set('dir1/dir12', 123);
      assert.strictEqual(cache.get('dir1/dir12'), 123);

      cache.set('dir1/dir12/file121', 123);
      assert.strictEqual(cache.get('dir1/dir12/file121'), 123);
    }, done);
  });


  it('sync to del hierachical key', (done) => {
    fibext(() => {
      const cache = new Cache({ stores: [{ class: Store, dir: './cache' }] });
      assert.strictEqual(cache.mget(hierKeys), undefined);

      const expected = {};
      hierKeys.forEach((key) => {
        cache.set(key, key);
        expected[key] = key;
      });
      assert(_.isEqual(cache.mget(hierKeys), expected));

      cache.del('dir1/dir11');
      assert.strictEqual(cache.get('dir1/dir11'), undefined);
      assert(_.isEqual(cache.get('dir1/dir11/dir111'), undefined));
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
