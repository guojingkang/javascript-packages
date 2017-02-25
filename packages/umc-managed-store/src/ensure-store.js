

const types = require('./types');

module.exports = function (storeOptions) {
  const structure = storeOptions.structure;
  const _entityName2StoreKey = storeOptions._entityName2StoreKey;
  const _entityNameType = storeOptions._entityNameType;

  let entityRecords;// {<entity name>: {<id>: <record>}}

  return ensureStore;

  function ensureStore(state) {
    entityRecords = {};

    // ensure entity map
    for (const entityName in _entityName2StoreKey) {
      const storeKey = _entityName2StoreKey[entityName];
      if (!state[storeKey] || typeof state[storeKey] !== 'object') state[storeKey] = {};
      entityRecords[entityName] = state[storeKey];
    }

    for (const entityName in entityRecords) {
      const records = entityRecords[entityName];
      const entityStruct = types.getTypeInfo(_entityNameType[entityName]).structure;
      if (entityStruct) {
        for (const id in records) {
          _ensure(records[id], entityStruct);
        }
      }
    }

    // ensure object structure and entity id reference
    const newState = _ensure(state, structure);

    entityRecords = null;
    return newState;
  }

  function _ensure(partState, partStruct) {
    Object.keys(partStruct).forEach((kk) => {
      if (types.is(kk)) { // entity id
        const info = types.getTypeInfo(kk);
        const entities = entityRecords[info.entity];

        Object.keys(partState).forEach((id) => {
          if (!entities.hasOwnProperty(id)) delete partState[id];
          else partState[id] = _ensureValue(partState[id], partStruct[kk]);
        });
      } else { // normal keys
        partState[kk] = _ensureValue(partState[kk], partStruct[kk]);
      }
    });

    return partState;
  }

  function _ensureValue(stateValue, structValue) {
    const valueType = typeof structValue;
    if (valueType === 'string' && types.is(structValue)) { // id/idArray/anyId here
      if (types.isId(structValue) || types.isAnyId(structValue)) {
        if (!stateValue) return '';
      } else if (!stateValue) return [];
      else {
        if (!Array.isArray(stateValue)) return [];

          // remove non-exist entity's reference
        const info = types.getTypeInfo(structValue);
        const entities = entityRecords[info.entity];

          // delete duplicate and no-entity id
        let existsIds = {};
        const newStateValue = stateValue.filter((id) => {
          if (existsIds[id] || !entities[id]) return false;
          existsIds[id] = true;
          return true;
        });
        existsIds = null;
        return newStateValue;
      }
    } else if (valueType === 'string') {
      if (!stateValue) return structValue;
    } else if (valueType === 'number') {
      if (!stateValue && stateValue !== 0) return structValue;
    } else if (valueType === 'boolean') {
      if (!stateValue && stateValue !== false) return structValue;
    } else if (!structValue) { // null|undefined
      if (!stateValue) return structValue;
    } else if (Array.isArray(structValue)) { // array will not do any overwrite
      if (!stateValue) return [];
    } else { // object
      if (!stateValue) {
        return _ensure({}, structValue);
      } else {
        return _ensure(stateValue, structValue);
      }
    }
    return stateValue;
  }
};

