
const Store = require('./basic-store');
const { createMap } = require('./structures/map');
const parseType = require('./structures/parse-type');

// use random to avoid duplicate id on hot reload
let MUTATION_ID_SEQ = parseInt(Math.random() * 100, 10);

class StructureStore extends Store {
  _Type = null;// structure type(class)
  mutationId = null;// represents the mutation id once calling mutate()

  constructor(options = {}) {
    super(options);
    const { structure, state } = options;

    // structure only support map type
    const { type, Type } = parseType(structure);
    if (type !== 'undefined' && type !== 'map') throw new Error(`Invalid type ${type} of structure`);
    if (type === 'undefined') {
      this._Type = createMap();
    } else {
      this._Type = Type;
    }
    this._state = new this._Type({ store: this, value: state });
  }

  // start a new mutation operation. `cb` function should only has sync codes
  mutate(cb) {
    if (this.mutationId) {
      throw new Error('Can\'t open another mutation operation');
    }
    if (!cb || typeof cb !== 'function') {
      throw new TypeError('Require callback function in store.mutate()');
    }

    try {
      this.mutationId = MUTATION_ID_SEQ;
      MUTATION_ID_SEQ = (MUTATION_ID_SEQ + 1) % 2147483647;

      const newState = this._state.clone();
      cb(newState);

      newState.bubbleModelMutation();
      const isChanged = newState.isChanged();

      this.mutationId = null;
      if (isChanged) super.setState(newState);
    } catch (e) {
      this.mutationId = null;
      throw e;
    }
  }

  setState(newState) { // eslint-disable-line class-methods-use-this
    throw new Error('Can\'t call store.setState() directly');
    // if (this.mutationId) {
    //   throw new Error('Don\'t call store.setState() directly in store.mutate()');
    // }
    // if (!(newState instanceof this._Type)) {
    //   throw new TypeError('Invalid state. Don\'t call store.setState() directly');
    // }
    // super.setState(newState);
  }
}

module.exports = StructureStore;
