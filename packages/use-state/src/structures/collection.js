
const isPlainObject = require('lodash.isplainobject');

// Collection is the super data type for Map, List, Model.
// A collection(instance) has such status:
// 1. none: with orignial data, data not changed
// 2. cloned: new instance, initially has same data with `none` status, prepares for mutation
// 3. changed: new instance with changed data, based on `cloned` status

class Collection {
  _store = null;// the bound global store
  _data = null;// keys' value
  _json = null;// the last exported plain json data

  // under which mutation operation(store.mutate()).
  // if this value equals to store's mutationId, that means collection was cloned
  // and ready for changed.
  _mutationId = null;

  // whether current data is changed directly.
  // if collection is cloned and this value is true, that means collection is changed.
  _isChanged = false;

  constructor(options) {
    this.init(options);
  }

  // use init to do constructor work, since in some cases(see model)
  // we need use `this` before `super()` called, which can't be applied in constructor
  init(options = {}) {
    const { store } = options;
    if (!store) throw new Error('Require store');
    this._store = store;
  }

  isCloned() {
    const storeMutationId = this._store.mutationId;
    return storeMutationId && this._mutationId === storeMutationId;
  }

  isChanged() {
    if (this.isCloned()) {
      return this._isChanged;
    }
    return false;
  }

  clone() {
    const mutationId = this._store.mutationId;
    if (!mutationId) {
      throw new Error('Can\'t change the state outside store.mutate()');
    }

    // already cloned
    if (this._mutationId === mutationId) return this;

    // now, we will clone a new collection

    // create a new collection with mutation operation id
    const cloned = Object.create(this.constructor.prototype);// no need to call constructor
    cloned._mutationId = mutationId;// eslint-disable-line no-underscore-dangle
    cloned._isChanged = false;// eslint-disable-line no-underscore-dangle

    // refer same data from old collection
    cloned._store = this._store;// eslint-disable-line no-underscore-dangle
    cloned._data = this._data;// eslint-disable-line no-underscore-dangle
    cloned._json = this._json;// eslint-disable-line no-underscore-dangle

    return cloned;
  }

  keys() { // eslint-disable-line class-methods-use-this

  }

  has(key) { // eslint-disable-line class-methods-use-this
    return false;
  }

  // normalize and validate the value, only for literal key
  validate(key, value) { // eslint-disable-line class-methods-use-this
    return value;
  }

  set(keysPath, value) {
    if (!keysPath && keysPath !== 0) throw new Error('Require key or keys path');
    if (!Array.isArray(keysPath)) keysPath = [keysPath];

    const key = keysPath[0];
    if (key === null || typeof key === 'undefined') throw new Error('Require key or keys path');
    if (!this.has(key)) throw new Error(`Nonexistent key ${key}`);

    const { type, Type } = this.getKeyDefinition(key);
    const isCollType = type === 'list' || type === 'map' || type === 'model';
    const oldValue = this.readKeyValue(key);

    if (keysPath.length > 1) { // try to call set recursively
      if (!isCollType) throw new Error(`Can't call set method on the value of key ${key}`);
      value = oldValue.set(keysPath.slice(1), value);
    } else if (typeof value === 'function') { // update key value in callback
      const cb = value;
      if (isCollType) {
        value = oldValue.clone();
        cb(value);// not require return value, since we already have the mutation copy
      } else { // normal literal value, like number/string/boolean
        value = cb(oldValue);
      }
    }

    if (isCollType) {
      if (!(value instanceof Type)) value = new Type({ store: this._store, value });
      else if (oldValue && !value.isChanged()) return this;
    } else {
      if (value === oldValue) return this;
      value = this.validate(key, value);
    }

    const cloned = this.clone();
    cloned.writeKeyValue(key, value);

    return cloned;
  }

  get(keysPath) {
    if (!keysPath && keysPath !== 0) throw new Error('Require key or keys path');
    if (!Array.isArray(keysPath)) keysPath = [keysPath];

    const key = keysPath[0];
    if (key === null || typeof key === 'undefined') throw new Error('Require key or keys path');
    if (!this.has(key)) throw new Error(`Nonexistent key ${key}`);

    const { type } = this.getKeyDefinition(key);
    const isCollType = type === 'list' || type === 'map' || type === 'model';
    const value = this.readKeyValue(key);

    if (keysPath.length > 1) {
      if (!isCollType) throw new Error(`Can't call get method on the value of key ${key}`);
      return value.get(keysPath.slice(1));
    } else {
      if (typeof value === 'undefined') return null;
      return value;
    }
  }

  // get key's definition, mainly for type and Type properties
  getKeyDefinition(key) { // eslint-disable-line class-methods-use-this
    return {};
  }

  // read the value at the key from the data
  readKeyValue(key) {
    const value = this._data[key];
    if (!value) return value;

    // if under mutation and key is model, always return the latest record value
    if (this._store.mutationId) {
      const { type, Type } = this.getKeyDefinition(key);
      if (type === 'model') {
        return Type.findById(value.getId()) || null;
      }
    }

    return value;
  }

  // write the value at the key to the data
  // derived class should override this method to do the actual write
  writeKeyValue(key, value) {
    this._isChanged = true;
    this._json = null;
    // write the key value to data in derived class
  }

  parseInitKeyValue(key, value) {
    const store = this._store;
    const { type, Type } = this.getKeyDefinition(key);
    if (type === 'map') {
      if (!value) {
        return new Type({ store });
      } else if (value instanceof Type) {
        return value;
      } else if (isPlainObject(value)) {
        return new Type({ store, value });
      } else {
        throw new Error(`Invalid initital value for key ${key}`);
      }
    } else if (type === 'list') {
      if (!value) {
        return new Type({ store });
      } else if (value instanceof Type) {
        return value;
      } else if (Array.isArray(value)) {
        return new Type({ store, value });
      } else {
        throw new Error(`Invalid initital value for key ${key}`);
      }
    } else if (type === 'model') {
      Type.bindStore(store);

      if (!value) {
        return null;
      } else if (value instanceof Type) {
        return value;
      } else if (isPlainObject(value)) {
        // always reuse the existent record on initing,
        // thus records with same id will be treated as same records,
        // to avoid circular-reference models creating multiple objects with same data
        let record = Type.findById(value.id);

        if (!record) record = new Type({ store, value });
        return record;
      } else {
        throw new Error(`Invalid initital value for key ${key}`);
      }
    } else if (value === null || typeof value === 'undefined') {
      return null;
    } else {
      return this.validate(key, value);
    }
  }

  // Since a model record may be refered on many positions, when we change the record,
  // all refered nodes and their ancestors should also be mutated.
  // That's the called `Mutation Bubble`.
  // This function will return a new cloned and changed object if the underlying model mutated.
  bubbleModelMutation() {
    const keys = this.keys(),
      len = keys.length;
    if (len <= 0) return;

    let obj = this;
    keys.forEach((key) => {
      const value = this._data[key];// same to obj._data[key];
      if (!value) return;

      const { type, Type } = this.getKeyDefinition(key);
      if (type === 'model') {
        let record = Type.findById(value.getId());
        if (record) {
          // use `$checked` to break circular relational records loop.
          if (record.$checked !== this._store.mutationId) {
            record.$checked = this._store.mutationId;
            const newValue = record.bubbleModelMutation();
            if (newValue) record = newValue;
          }
        }
        if (record !== value) { // record changed(deleted or updated)
          // next lines are equal to but faster than `this.set(key, record)`
          obj = obj.clone();
          obj.writeKeyValue(key, record);
        }
      } else if (type === 'map' || type === 'list') {
        const newValue = value.bubbleModelMutation();
        if (newValue) { // cloned and changed
          // next lines are equal to but faster than `this.set(key, newValue)`
          obj = obj.clone();
          obj.writeKeyValue(key, newValue);
        }
      }
    });

    if (obj === this) return null;
    return obj;
  }

  toJSON() {
    if (this._json) return this._json;

    // assign this._json first to avoid infinite loop on circular invoke
    const data = this._json = Array.isArray(this._data) ? [] : {};

    this.keys().forEach((key) => {
      const value = this.readKeyValue(key);
      if (!value) {
        data[key] = value;
        return;
      }

      const { type } = this.getKeyDefinition(key);
      if (type === 'map' || type === 'list' || type === 'model') {
        data[key] = value.toJSON(true);
      } else {
        data[key] = value;
      }
    });

    return data;
  }
}

module.exports = Collection;

