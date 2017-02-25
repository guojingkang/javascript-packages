
const BasicStore = require('./basic-store');
const StructureStore = require('./structure-store');
const { createMap } = require('./structures/map');
const { createList } = require('./structures/list');
const { createModel } = require('./structures/model');
const { connect, Provider } = require('./react');

function createBasicStore(...args) {
  return new BasicStore(...args);
}

function createStructureStore(...args) {
  return new StructureStore(...args);
}

module.exports = {
  Store: StructureStore, createStore: createStructureStore,
  BasicStore, createBasicStore,
  List: createList, Map: createMap, Model: createModel,
  connect, Provider,
};
