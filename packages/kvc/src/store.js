

const util = require('./util');

class Store {
  constructor(options) {
    options || (options = {});

    this.name = this._name = options.name || '';
    this._ttl = options.ttl || 0;
    this._prefix = (options.prefix || '').trim();
  }

  // set(key: string, val: any, options?: number|object): promise
  // set(key: object|array, options?: number|object): promise
  // parameter key is object: {key1: val1, key2: val2, ...}
  // parameter key is array: [key1, val1, key2, val2, ...]
  // parameter options is number: means the ttl
  // parameter options is object: {ttl: number, xxx: yyy}
  // if keys's value is undefined, it's same to del the key
  set(key, value, options) {
    // parse the key-value pairs
    let kvs = {};
    if (typeof key !== 'string') {
      options = value;
      if (Array.isArray(key)) {
        const len = key.length;
        for (let ii = 0; ii < len; ++ii) {
          kvs[key[ii]] = key[ii + 1];
          ++ii;
        }
      } else kvs = key;
    } else {
      kvs[key] = value;
    }

    // parse the options
    if (typeof options === 'number') {
      options = { ttl: options };
    } else {
      options || (options = {});
    }
    if (options.ttl) {
      options.ttl = +options.ttl;
    }
    if (!options.ttl && options.ttl !== 0) options.ttl = this._ttl;

    // check the keys need set or del, and apply the prefix
    let delKeys = [],
      newKvs = {},
      needSet = false;
    for (const kk in kvs) {
      if (!kk) continue;

      const vv = kvs[kk];
      if (typeof vv === 'undefined') delKeys.push(kk);
      else {
        needSet = true;
        const item = { value: vv };
        if (options.ttl > 0) item.expire = Date.now() + options.ttl;
        newKvs[this._prefix + kk] = item;
      }
    }
    kvs = needSet ? newKvs : null;
    delKeys = delKeys.length > 0 ? delKeys : null;

    try {
      return Promise.all([
        delKeys ? this.del(delKeys) : null,
        kvs ? this._set(kvs, options) : null,
      ]).then(result => result[1]);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // (key1: string, key2: string, ...): object({key: value, ...})
  // (keys: array<string>): object
  mget(keys) {
    keys = util.parseMGet.apply(null, arguments)[0];
    if (keys.length <= 0) return Promise.resolve({});

    if (this._prefix) keys = keys.map(key => (this._prefix + key));

    try {
      return Promise.resolve(this._mget(keys)).then((kis) => {
        let newKvs = {},
          len = this._prefix.length;
        for (let kk in kis) {
          let ki = kis[kk],
            val = ki && ki.value;
          if (ki && ki.expire && Date.now() > ki.expire) val = undefined;

          if (this._prefix) kk = kk.slice(len);
          newKvs[kk] = val;
        }
        return newKvs;
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // (key: string): any
  get(key) {
    key = util.parseGet.apply(null, arguments)[0];
    return this.mget(key).then((kvs) => {
      if (!kvs) return undefined;
      else return kvs[key];
    });
  }

  // (key1, key2, ...)
  // ([key1, key2, ...])
  del(keys) {
    keys = util.parseDel.apply(null, arguments)[0];
    if (keys.length <= 0) return Promise.resolve();

    if (this._prefix) keys = keys.map(key => (this._prefix + key));

    try {
      return Promise.resolve(this._del(keys));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // get the keys, only accept true or reg expr(pattern)
  keys(pattern) {
    if (!pattern) return Promise.resolve([]);
    if (typeof pattern === 'string') pattern = util.wild2re(pattern);

    try {
      return Promise.resolve(this._keys(pattern)).then((keys) => {
        if (!keys || keys.length <= 0) return [];
        if (!this._prefix) return keys;

        const len = this._prefix.length;
        return keys.reduce((result, key) => {
          if (key.startsWith(this._prefix)) {
            key = key.slice(len);
            if (pattern === true || pattern.test(key)) result.push(key);
          }
          return result;
        }, []);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  clear() {
    try {
      if (!this._prefix) return Promise.resolve(this._clear());

      return Promise.resolve(this._keys(util.wild2re(`${this._prefix}*`))).then((keys) => {
        if (!keys || keys.length <= 0) return;
        return this._del(keys);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // these methods should be implemented by sub stores!
  _set(kis, options) {}
  _mget(keys) {}
  _del(keys) {}
  _keys(re) {}
  _clear() {}
}

module.exports = Store;
