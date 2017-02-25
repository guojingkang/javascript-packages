

const types = require('./types');

module.exports = function (storeOptions) {
  const structure = storeOptions.structure;
  const beforeClear = storeOptions.beforeClear;
  const _entityName2StoreKey = storeOptions._entityName2StoreKey;
  const _entityNameChain = storeOptions._entityNameChain;
  const _entityNameType = storeOptions._entityNameType;
  const entityNames = Object.keys(_entityName2StoreKey);

  let options, // clearStore function options
    entityRecords,
    entityRefs, // whether the entity record has refs: {<entity name>: {<record id>: true|false}}
    weakParts, // weak part state and corresponding structrue; weak part ref calced in second run
    entityNameLastRefCount;// already calced structure's entity name;

  return clearStore;

  // _options.truncate: number, truncate the idArrayOf type's rows
  function clearStore(_options) {
    const store = this;
    const state = store.state;
    entityRecords = {}, entityRefs = {}, weakParts = [];
    entityNames.forEach((name) => {
      entityRefs[name] = {};
      entityRecords[name] = state[_entityName2StoreKey[name]];
    });

    options = _options && typeof _options === 'object' ? _options : {};
    if (typeof options.truncate === 'number' && options.truncate >= 0) options.truncate = ~~options.truncate;
    else options.truncate = -1;

    if (beforeClear && typeof beforeClear === 'function') {
      const customRefs = beforeClear.call(store, state);
      if (customRefs && customRefs.length > 0) {
        customRefs.forEach((ref) => {
          const refs = entityRefs[ref.entity];
          if (!refs) return;
          refs[ref.id] = true;
        });
      }
    }

    // first run: calc non-weak and non-chain position
    _calcRef(state, structure);

    // second run: calc weak parts
    weakParts.forEach((part) => {
      let refs = entityRefs[part.entity],
        partState = part.state,
        partStruct = part.structure;
      Object.keys(part.state).forEach((id) => {
        if (!refs[id]) return;
        _calcRefForValue(partState[id], partStruct);
      });
    });

    // last run: calc ref in entity structure(for the chain ref)
    entityNameLastRefCount = {};
    Object.keys(_entityNameChain).forEach((entityName) => {
      _calcEntityOwnStructure(entityName);
    });

    // remove entities which not referenced
    const newState = Object.assign({}, state);
    entityNames.forEach((entityName) => {
      const storeKey = _entityName2StoreKey[entityName];
      let entities = newState[storeKey],
        refs = entityRefs[entityName];
      Object.keys(entities).forEach((id) => {
        if (!refs[id]) delete entities[id];
      });
    });

    options = null, entityRecords = null, entityRefs = null, weakParts = null, entityNameLastRefCount = null;
    store.setState(newState);
  }

  function _calcEntityOwnStructure(entityName) {
    let refs = entityRefs[entityName],
      count = Object.keys(refs).length;
    if (count === entityNameLastRefCount[entityName]) return;
    entityNameLastRefCount[entityName] = count;

    const chain = _entityNameChain[entityName];
    if (!chain || chain.length <= 0) return;

    const structure = types.getTypeInfo(_entityNameType[entityName]).structure;

    const records = entityRecords[entityName];
    for (const id in records) {
      const isDepEntityRefed = refs[id];
      if (isDepEntityRefed) _calcRef(records[id], structure, true);
    }

    chain.forEach((chainEntityName) => {
      _calcEntityOwnStructure(chainEntityName);
    });
  }

  function _calcRef(partState, partStruct, isDepEntityRefed) {
    Object.keys(partStruct).forEach((kk) => {
      if (types.is(kk)) { // entity id
        const info = types.getTypeInfo(kk);
        const entityName = info.entity;
        Object.keys(partState).forEach((id) => {
          if (info.weak) { // weak part calculated at last
            weakParts.push({ state: partState, entity: entityName, structure: partStruct[kk] });
          } else if (!info.chain) {
            entityRefs[entityName][id] = true;
            _calcRefForValue(partState[id], partStruct[kk], isDepEntityRefed);
          } else if (info.chain) { // chain ref and that means partStruct is in entity structure.
            // and this branch is always the last run
            if (isDepEntityRefed) entityRefs[entityName][id] = true;
            _calcRefForValue(partState[id], partStruct[kk], isDepEntityRefed);
          }
        });
      } else { // normal keys
        _calcRefForValue(partState[kk], partStruct[kk], isDepEntityRefed);
      }
    });
  }

  function _calcRefForValue(stateValue, structValue, isDepEntityRefed) {
    const valueType = typeof structValue;
    if (valueType === 'string' && types.is(structValue)) { // Id/IdArray here
      if (types.isId(structValue)) {
        if (!stateValue) return;
        const info = types.getTypeInfo(structValue);
        const entityName = info.entity;

        if (!info.weak) {
          if (!info.chain || isDepEntityRefed) entityRefs[entityName][stateValue] = true;
        }
      } else if (types.isIdArray(structValue)) {
        if (!stateValue || !Array.isArray(stateValue)) return;
        if (options.truncate === 0) return;
        const info = types.getTypeInfo(structValue);
        const entityName = info.entity;

        const rows = options.truncate > 0 ? stateValue.slice(0, options.truncate) : stateValue;
        rows.forEach((id) => {
          if (!info.weak) {
            if (!info.chain || isDepEntityRefed) entityRefs[entityName][id] = true;
          }
        });
      } else if (types.isAnyId(structValue)) {
        if (!stateValue) return;
        const info = types.getTypeInfo(structValue);
        const entityNames = info.entity;

        if (!info.weak) {
          if (!info.chain || isDepEntityRefed) {
            entityNames.forEach(entityName => (entityRefs[entityName][stateValue] = true));
          }
        }
      }
    } else if (valueType === 'number' || valueType === 'string' || valueType === 'boolean') { // primitive

    } else { // object
      if (!stateValue) return;
      return _calcRef(stateValue, structValue, isDepEntityRefed);
    }
  }
};
