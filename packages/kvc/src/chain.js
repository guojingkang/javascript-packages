

const Store = require('./store');
const util = require('./util');

// new Chain(store1, store2, ..., storeN, options)
function Chain() {
  this._stores = [];

  const len = arguments.length;
  for (let ii = 0; ii < len; ++ii) {
    const value = arguments[ii];
    if (value instanceof Store) {
      if (this._stores.indexOf(value) >= 0) continue;
      this._stores.push(value);
    }
  }
}
const proto = Chain.prototype;
module.exports = Chain;

proto.set = function () {
  return Promise.all(this._stores.map(store => store.set(...arguments)))
  .then(result => result[0]);
};

proto.mget = function () {
  const args = util.parseMGet.apply(null, arguments);

  let index = -1,
    len = this._stores.length,
    maxIndex = len - 1;
  const next = () => {
    if (index >= maxIndex) return Promise.resolve({});
    index++;
    const store = this._stores[index];
    return store.mget(...args).then((kis) => {
      const remainKeys = [];
      args[0].forEach((key) => {
        if (typeof kis[key] === 'undefined') remainKeys.push(key);
      });

      if (remainKeys.length > 0) {
        args[0] = remainKeys;
        return next().then((remainKis) => {
          let needSetKis = {},
            needSet = false;
          for (const rk in remainKis) {
            const ri = remainKis[rk];
            if (typeof ri === 'undefined') continue;
            kis[rk] = ri;
            needSetKis[rk] = ri, needSet = true;
          }
          if (needSet) store.set(needSetKis);
          return kis;
        });
      } else return kis;
    });
  };
  return next();
};

proto.get = function () {
  const args = util.parseGet.apply(null, arguments);

  let index = -1,
    len = this._stores.length,
    maxIndex = len - 1;
  const next = () => {
    if (index >= maxIndex) return Promise.resolve();
    index++;
    const store = this._stores[index];
    return store.get(...args).then((value) => {
      if (typeof value === 'undefined') {
        return next().then((nextValue) => {
          if (typeof nextValue !== 'undefined') {
            store.set(args[0], nextValue);
          }
          return nextValue;
        });
      } else return value;
    });
  };
  return next();
};

proto.del = function () {
  return Promise.all(this._stores.map(store => store.del(...arguments)))
  .then(result => result[0]);
};

proto.keys = function () {
  return Promise.all(this._stores.map(store => store.keys(...arguments)))
  .then(result => result.reduce((keys, nextKeys) => util.uniqueConcat(keys, nextKeys), []));
};

proto.clear = function () {
  return Promise.all(this._stores.map(store => store.clear(...arguments)))
  .then(result => result[0]);
};
