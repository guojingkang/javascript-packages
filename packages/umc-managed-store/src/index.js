

const types = require('./types');
const createManagedStore = require('./managed-store');

module.exports = {
  Types: types.types,
  create: createManagedStore,
};
