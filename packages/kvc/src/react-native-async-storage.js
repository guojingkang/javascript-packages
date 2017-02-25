

const Store = require('./store');
const Buffer = require('buffer').Buffer;
const AsyncStorage = require('react-native').AsyncStorage;

class ReactNativeAsyncStorage extends Store {
  constructor(options) {
    super(options);
    options || (options = {});

    this.name = this._name = options.name || 'react-native-async-storage';
  }

  _set(kvs, options) {
    let size = 0;// bytes
    kvs = Object.keys(kvs).map((key) => {
      const item = JSON.stringify(kvs[key]);
      if (options.returnSize) size += Buffer.byteLength(item, 'utf8');
      return [key, item];
    });

    return AsyncStorage.multiSet(kvs).then(() => {
      if (options.returnSize) return { size };
    });
  }

  _mget(keys) {
    return AsyncStorage.multiGet(keys).then((kvs) => {
      const result = {};
      kvs.forEach((kv) => {
        let key = kv[0],
          item = kv[1];
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
      });
      return result;
    });
  }

  _del(keys) {
    return AsyncStorage.multiRemove(keys);
  }

  _keys(re) {
    return AsyncStorage.getAllKeys().then((keys) => {
      const result = [];
      keys || (keys = []);
      if (re === true) return keys;

      keys.forEach((key) => {
        if (re.test(key)) result.push(key);
      });
      return result;
    });
  }

  _clear() {
    return AsyncStorage.clear();
  }
}

module.exports = ReactNativeAsyncStorage;

