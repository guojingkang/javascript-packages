

const bytes = require('bytes');

module.exports = function (storeOptions) {
  if (storeOptions.save) {
    const saveOptions = storeOptions.save;

    if (typeof saveOptions === 'function') {
      return saveOptions;
    }

    const sizeKey = saveOptions.sizeKey || 'size';// state key to put the store size
    const autoClearInteval = saveOptions.autoClearInterval || 5 * 60 * 1000;// at least 5mins to do next auto clear
    const clearThreshold = saveOptions.autoClearThreshold || bytes('10mb');

    let write;
    if (typeof saveOptions.write === 'function') {
      write = saveOptions.write;
    } else {
      let cache = saveOptions.cache, // a kvc's store, like kvc/memory, kvc/file
        cacheKey = saveOptions.cacheKey;
      if (cache && cache.set && cacheKey) {
        write = state => cache.set(cacheKey, state, { returnSize: true });
      }
    }

    let filter = saveOptions.filter;
    if (!filter || typeof filter !== 'function') filter = null;

    let lastAutoClear = 0;
    return function () {
      const store = this;
      if (!store.state) return;
      let state = store.state;

      if (filter) state = filter(state);

      return Promise.resolve(write(state)).then((result) => {
        if (!result || !result.size) return;

        // directly modify the state(to improve performance),
        // so the size change will be notified on next setState(mostly it's ok:)
        store.state[sizeKey] = bytes(result.size);

        if (result.size >= clearThreshold) {
          const now = Date.now();
          if (now - lastAutoClear < autoClearInteval) return;
          lastAutoClear = now;
          return store.clear();
        }
      });
    };
  }
  return nope;
};

function nope() {}
