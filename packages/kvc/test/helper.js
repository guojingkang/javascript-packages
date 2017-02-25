

exports.ErrorStore = ErrorStore;

const util = require('util');
const Store = require('..').Store;

function ErrorStore(options) {
  Store.apply(this, arguments);
  this.options = options;
}
util.inherits(ErrorStore, Store);

ErrorStore._set = (kvs, options) => prom(this.options);
ErrorStore._mget = keys => prom(this.options);
ErrorStore._del = keys => prom(this.options);
ErrorStore._clear = () => prom(this.options);

function prom(options) {
  const err = new Error('error store');
  if (options.throw) throw err;
  return Promise.reject(err);
}

exports.sleep = function (ms) {
  ms || (ms = 0);
  return new Promise(r => setTimeout(() => r(), ms));
};

let async_storage = {};
function AsyncStorage() {

}
exports.AsyncStorage = AsyncStorage;

AsyncStorage.multiSet = function (kvs) {
  return exports.sleep().then(() => {
    kvs.forEach((kv) => {
      async_storage[kv[0]] = kv[1];
    });
  });
};
AsyncStorage.multiGet = function (keys) {
  if (!keys || keys.length === 0) throw new Error('invalid key');
  return exports.sleep().then(() => keys.map(key => [key, async_storage[key]]));
};
AsyncStorage.getAllKeys = function () {
  return exports.sleep().then(() => Object.keys(async_storage));
};
AsyncStorage.multiRemove = function (keys) {
  if (!keys || keys.length === 0) throw new Error('invalid key');
  return exports.sleep().then(() => {
    keys.forEach((key) => {
      delete async_storage[key];
    });
  });
};
AsyncStorage.clear = function () {
  return exports.sleep().then(() => (async_storage = {}));
};

module.constructor.prototype._require = module.constructor.prototype.require;
module.constructor.prototype.require = function (name) {
  if (name === 'react-native') {
    return { AsyncStorage };
  }
  return this._require(name);
};

let local_storage = {};
function LocalStorage() {
}
exports.localStorage = LocalStorage;

LocalStorage.setItem = function (key, value) {
  local_storage[key] = value;
};
LocalStorage.getItem = function (key) {
  return local_storage[key];
};
Object.defineProperty(LocalStorage, 'length', {
  get() {
    return Object.keys(local_storage).length;
  },
});
LocalStorage.key = function (index) {
  return Object.keys(local_storage)[index];
};
LocalStorage.removeItem = function (key) {
  delete local_storage[key];
};
LocalStorage.clear = function () {
  return (local_storage = {});
};
