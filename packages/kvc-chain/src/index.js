

module.exports = function (store1, store2) {
  if (!store || !(store instanceof Store)) throw new TypeError('need a store in the chain method');
  let prev = this;
  while ((prev = prev._prevStore)) {
    if (prev === store) throw new Error('store already in the chain');
  }
  if (store._prefix !== this._prefix) {
    throw new Error('chain stores should have same prefix option');
  }
  if (store._ttl !== this._ttl) {
    throw new Error('chain stores should have same ttl option');
  }

  // proxy the methods
  this._realSet = this._set;
  this._realMget = this._mget;
  this._realDel = this._del;
  this._realKeys = this._keys;
  this._realClear = this._clear;

  // set the chain
  this._nextStore = store;
  store._prevStore = this;

  // overwrite the methods
  this._set = function (kvs, options) {
    return Promise.resolve(this._realSet(kvs, options)).then((result) => {
      if (options.returnSize) {
        options = Object.assign({}, options);
        delete options.returnSize;
      }
      if (this._nextStore) return Promise.resolve(this._nextStore._set(kvs, options)).then(() => result);
      else return result;
    });
  };
  this._del = function (keys) {
    return Promise.resolve(this._realDel(keys)).then(() => {
      if (this._nextStore) return this._nextStore._del(keys);
    });
  };
  this._clear = function () {
    return Promise.resolve(this._realClear()).then(() => {
      if (this._nextStore) return this._nextStore._clear();
    });
  };
  this._keys = function (re) {
    return Promise.resolve(this._realKeys(re)).then((keys) => {
      if (!this._nextStore) return keys;
      return Promise.resolve(this._nextStore._keys(re)).then(nextKeys => util.uniqueConcat(keys, nextKeys));
    });
  };
  this._mget = function (keys) {
    return Promise.resolve(this._realMget(keys)).then((kis) => {
      if (!this._nextStore) return kis;

      const remainKeys = [];
      keys.forEach((key) => {
        if (typeof kis[key] === 'undefined') remainKeys.push(key);
      });
      if (remainKeys.length > 0) {
        return Promise.resolve(this._nextStore._mget(remainKeys)).then((remainKis) => {
          let needSetKis = {},
            needSet = false;
          for (const rk in remainKis) {
            const ri = remainKis[rk];
            if (typeof ri === 'undefined') continue;
            kis[rk] = ri;
            needSetKis[rk] = ri, needSet = true;
          }
          if (needSet) return Promise.resolve(this._set(needSetKis, {})).then(() => kis);
          else return kis;
        });
      } else return kis;
    });
  };

  return store1;
};

console.log('hello world');
