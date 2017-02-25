

const Store = require('./store');

class MemStore extends Store {
  constructor(options) {
    super(options);
    options || (options = {});

    this.name = this._name = options.name || 'memory';
    this._algorithm = (options.algorithm || 'lru').toLowerCase();

    this._data = {};
  }

  _set(kvs, options) {
    let size = 0;// bytes

    for (const key in kvs) {
      const item = JSON.stringify(kvs[key]);
      if (options.returnSize) size += item.length * 2;// memory chars in utf-16
      this._data[key] = item;
    }
    if (options.returnSize) return { size };
  }

  _mget(keys) {
    return keys.reduce((result, key) => {
      let item = this._data[key];
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
      if (this._data[key]) this._data[key] = undefined;
    });
  }

  _keys(re) {
    const keys = [];
    for (const key in this._data) {
      if (typeof this._data[key] === 'undefined') continue;
      if (re === true || re.test(key)) {
        keys.push(key);
      }
    }
    return keys;
  }

  _clear() {
    this._data = {};
  }
}

module.exports = MemStore;
