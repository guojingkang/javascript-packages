

const types = require('./types');

module.exports = function (storeOptions) {
  const _entityNameType = {};// {<entity name>:<type name whose subType=map>}
  const _entityNameChain = {};// chain reference, like a->b, b->c, a->c ...
  const _entityName2StoreKey = getEntityNameKeyMap(storeOptions.structure);

  parseStructure(storeOptions.structure);
  parseEntityStructure();

  storeOptions._entityNameChain = _entityNameChain;
  storeOptions._entityName2StoreKey = _entityName2StoreKey;
  storeOptions._entityNameType = _entityNameType;

  // currently only support top level key
  function getEntityNameKeyMap(structure) {
    const result = {};
    for (const kk in structure) {
      const vv = structure[kk];
      if (typeof vv === 'string') {
        if (types.isMap(vv)) {
          const info = types.getTypeInfo(vv);
          const entityName = info.entity;

          if (_entityNameType[entityName]) throw new Error(`Duplicate entity ${entityName}`);
          _entityNameType[entityName] = vv;

          result[entityName] = kk;
          delete structure[kk];
        }
      }
    }
    return result;
  }

  function parseEntityStructure() {
    Object.keys(_entityName2StoreKey).forEach((entityName) => {
      const structure = types.getTypeInfo(_entityNameType[entityName]).structure;
      if (!structure) return;
      _entityNameChain[entityName] = [];
      parseStructure(structure, entityName);
    });
  }

  function parseStructure(partStruct, containerEntityName) {
    let typeKey = null;// like object: {[Types.idOf('xxx')]: yyy}

    // first, check whether type key exists. If exists, all other keys will be removed
    Object.keys(partStruct).forEach((kk) => {
      const keyType = typeof kk;

      if (keyType === 'string' && types.is(kk)) {
        typeKey = kk;
        if (!types.isId(kk)) throw new Error(`Allow only idOf type in the key ${kk}`);
        const info = types.getTypeInfo(kk);
        if (!_entityName2StoreKey[info.entity]) throw new Error(`Require entity ${info.entity} defined`);
        if (containerEntityName) {
          _entityNameChain[containerEntityName].push(info.entity);
          info.chain = true;
        }

        parseStructureValue(kk, partStruct[kk], containerEntityName);
      }
    });

    if (typeKey) { // remove all other keys
      Object.keys(partStruct).forEach(key => key !== typeKey && delete partStruct[key]);
    } else { // no type key, then treat as a normal plain object
      Object.keys(partStruct).forEach((kk) => {
        parseStructureValue(kk, partStruct[kk], containerEntityName);
      });
    }
  }

  function parseStructureValue(key, value, containerEntityName) {
    if (!value) return;// null|undfined|0|false|''
    if (Array.isArray(value)) return;

    const valueType = typeof value;
    if (valueType === 'string' && types.is(value)) { // id/idArray/anyId here
      if (!types.isId(value) && !types.isIdArray(value) && !types.isAnyId(value)) {
        throw new Error(`Accept only idOf/idArrayOf/anyIdOf in the value of key ${key}`);
      }
      const info = types.getTypeInfo(value);
      let entityNames = info.entity;
      if (!types.isAnyId(value)) entityNames = [info.entity];

      entityNames.forEach((entityName) => {
        if (!_entityName2StoreKey[entityName]) throw new Error(`Require entity ${entityName} defined`);
        if (containerEntityName) {
          _entityNameChain[containerEntityName].push(entityName);
          info.chain = true;
        }
      });
    } else if (valueType === 'number' || valueType === 'string' || valueType === 'boolean') { // primitive

    } else { // object
      parseStructure(value, containerEntityName);
    }
  }
};
