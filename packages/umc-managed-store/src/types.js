

const ENTITY_MAP_OF_PREFIX = '-umcms-entity-';
const ENTITY_ID_ARRAY_OF_PREFIX = '-umcms-entity-id-array-';
const ENTITY_ID_OF_PREFIX = '-umcms-entity-id-';
const ENTITY_ID_OF_ANY_PREFIX = '-umcms-entity-id-any-';
let seq = 0;

// type's info properties:
//  entity: entity name
//  subType: map|array|id
//  structure: the entity structure, only for subType=map
//  weak: only for subType=id|array. indicate whether is weak reference. weak referecen
//    will not be used to do reference count for the target entity record
//  chain: auto set, only for subType=id|array and type in entity structure definition.
//    indicate whether is chain reference. chain reference will only be
//    used to do reference count for the target entity record when current
//    structure entity record has been referenced.
const typeInfo = {};

const types = {
  mapOf: (entityName, options) => {
    options || (options = {});
    const type = ((seq++) + ENTITY_MAP_OF_PREFIX + entityName);
    typeInfo[type] = { entity: entityName, subType: 'map', structure: options.structure };
    return type;
  },
  idArrayOf: (entityName, options) => {
    options || (options = {});
    const type = ((seq++) + ENTITY_ID_ARRAY_OF_PREFIX + entityName);
    typeInfo[type] = { entity: entityName, subType: 'array', chain: false };
    return type;
  },
  idOf: (entityName, options) => {
    options || (options = {});
    const type = ((seq++) + ENTITY_ID_OF_PREFIX + entityName);
    typeInfo[type] = { entity: entityName, subType: 'id', weak: !!options.weak, chain: false };
    return type;
  },
  anyIdOf: (entityNames, options) => {
    if (!entityNames || entityNames.length <= 1) throw new Error('anyIdOf needs an array with more than 1 entity names');
    options || (options = {});
    const type = ((seq++) + ENTITY_ID_OF_ANY_PREFIX + entityNames.join('-'));
    typeInfo[type] = { entity: entityNames, subType: 'id-any', weak: !!options.weak, chain: false };
    return type;
  },
};

function is(type) {
  return !!typeInfo[type];
}

function isMap(type) {
  const info = typeInfo[type];
  if (!info) return false;
  return info.subType === 'map';
}

function isIdArray(type) {
  const info = typeInfo[type];
  if (!info) return false;
  return info.subType === 'array';
}

function isId(type) {
  const info = typeInfo[type];
  if (!info) return false;
  return info.subType === 'id';
}

function isAnyId(type) {
  const info = typeInfo[type];
  if (!info) return false;
  return info.subType === 'id-any';
}

function getTypeInfo(type) {
  return typeInfo[type];
}

module.exports = {
  types,
  is, isId, isMap, isIdArray, isAnyId,
  getTypeInfo,
};
