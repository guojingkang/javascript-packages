

const umc = require('umc');

const DEFAULT_SET_STATE_OPTIONS = { ensure: true, save: true };

function createManagedStore(storeOptions) {
  storeOptions || (storeOptions = {});
  if (!storeOptions.structure) throw new Error('Require structure property in managed store');

  require('./parse-structure')(storeOptions);
  const ensureStore = require('./ensure-store')(storeOptions);
  const clearStore = require('./clear-store')(storeOptions);
  const saveStore = require('./save-store')(storeOptions);

  const initialState = ensureStore({});

  const store = umc(initialState);
  store.ensure = ensureStore;
  store.clear = clearStore;
  store.save = saveStore;

  const oldSetState = store.setState;
  store.setState = function (state, options) {
    options || (options = {});
    options = Object.assign({}, DEFAULT_SET_STATE_OPTIONS, options);

    // 确保数据结构安全
    if (options.ensure) {
      state = Object.assign({}, store.state, state);
      state = ensureStore(state);
    }

    oldSetState.call(store, state);

    // save to the cache
    if (options.save) {
      store.save();
    }
  };

  return store;
}

module.exports = createManagedStore;
