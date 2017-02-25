
const Collection = require('./collection');
const parseType = require('./parse-type');

class List extends Collection {
  static Type = null;// the class(constructor function) of element type
  static type = null;// the literal string represents Type

  static setElementType(Type) {
    const typeInfo = parseType(Type);
    const { type, invalid } = typeInfo;
    if (type === 'map' || type === 'list' || invalid) throw new TypeError(`Invalid element type ${type} in list`);

    this.type = type;
    this.Type = typeInfo.Type;
  }

  static derive(SubClass) {
    SubClass.Type = null;
    SubClass.type = null;
    SubClass.setElementType = this.setElementType;
    if (!SubClass.derive) SubClass.derive = this.derive;
  }

  init(options = {}) {
    super.init(options);
    const { store, value = [] } = options;

    // initiate
    const { type, Type } = this.constructor;
    if (type === 'model') Type.bindStore(store);

    this._data = value.map((element, index) => this.parseInitKeyValue(index, element));
  }

  keys() {
    return Object.keys(this._data);
  }

  has(key) { // eslint-disable-line class-methods-use-this
    const type = typeof key;
    if (type === 'string') {
      key = parseInt(key, 10);
      if (isNaN(key)) return false;
    } else if (typeof key !== 'number') return false;

    if (key < 0) {
      key += this._data.length;
      if (key < 0) return false;
    }
    return true;
  }

    // normalize and validate the value
  validate(key, value) { // eslint-disable-line class-methods-use-this
    return value;
  }

  getKeyDefinition(key) { // eslint-disable-line class-methods-use-this
    const { type, Type } = this.constructor;
    return { type, Type };
  }

  readKeyValue(key) {
    const len = this._data.length;
    if (key < 0) key += len;
    if (key >= len) {
      return null;
    } else {
      return super.readKeyValue(key);
    }
  }

  writeKeyValue(key, value) {
    super.writeKeyValue(key, value);

    const len = this._data.length;
    if (key < 0) key = len + key;
    if (key >= len) {
      this._data = [...this._data];
      this._data[key] = value;
    } else {
      this._data = [...this._data.slice(0, key), value, ...this._data.slice(key + 1)];
    }
  }
}

function createList(Type, options = {}) {
  class DerivedList extends List {
  }
  List.derive(DerivedList);
  DerivedList.setElementType(Type);
  Type = null;

  return DerivedList;
}

module.exports = { createList, List };
