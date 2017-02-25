

// web browser localStorage store

const Buffer = require('buffer').Buffer;
const Store = require('./store');

class LocalStorage extends Store {
  constructor(options) {
    super(options);
    options || (options = {});

    this.name = this._name = options.name || 'local-storage';

    if (typeof localStorage === 'undefined') throw new Error('no global localStorage');
    this._storage = localStorage;//eslint-disable-line
  }

  _set(kvs, options) {
    let size = 0;// bytes
    Object.keys(kvs).map((key) => {
      const item = JSON.stringify(kvs[key]);
      if (options.returnSize) size += Buffer.byteLength(item, 'utf8');
      this._storage.setItem(key, item);
    });

    if (options.returnSize) return { size };
  }

  _mget(keys) {
    return keys.reduce((result, key) => {
      let item = this._storage.getItem(key);
      if (item) {
        try {
          item = JSON.parse(item);
        } catch (e) {
          item = undefined;
        }
      }
      if (!item) item = undefined;
      result[key] = item;
      return result;
    }, {});
  }

  _del(keys) {
    return keys.forEach((key) => {
      this._storage.removeItem(key);
    });
  }

  _keys(re) {
    let len = this._storage.length,
      result = [];
    for (let ii = 0; ii < len; ++ii) {
      const key = this._storage.key(ii);
      if (re === true || re.test(key)) result.push(key);
    }
    return result;
  }

  _clear() {
    return this._storage.clear();
  }
}

module.exports = LocalStorage;

