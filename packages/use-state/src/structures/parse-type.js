/* eslint no-prototype-builtins:off */

const isPlainObject = require('lodash.isplainobject');

function parseType(Type) {
  const { Model } = require('./model');
  const { List } = require('./list');
  const { Map: Map2, createMap } = require('./map');

  let type = typeof Type,
    invalid = false,
    isCollType = false, // eslint-disable-line no-unused-vars
    defaultVal = null;
  if (type === 'undefined' || Type === null) {
    Type = undefined;
    type = 'undefined';
  } else if (type === 'number') {
    defaultVal = Type;
    Type = Number;
  } else if (type === 'boolean') {
    defaultVal = Type;
    Type = Boolean;
  } else if (type === 'string') {
    defaultVal = Type;
    Type = String;
  } else if (Array.isArray(Type)) {
    // Type = createList(undefined, { default: Type });
    // type = 'list';
    invalid = true;
    type = 'Array';
    Type = Array;
  } else if (isPlainObject(Type)) {
    Type = createMap(Type);
    type = 'map';
    isCollType = true;
  } else if (Type === Number) {
    type = 'number';
  } else if (Type === String) {
    type = 'string';
  } else if (Type === Boolean) {
    type = 'boolean';
  } else if (Model.prototype.isPrototypeOf(Type.prototype)) {
    type = 'model';
    isCollType = true;
  } else if (Map2.prototype.isPrototypeOf(Type.prototype)) {
    type = 'map';
    isCollType = true;
  } else if (List.prototype.isPrototypeOf(Type.prototype)) {
    type = 'list';
    isCollType = true;
  } else {
    type = String(Type);
    const match = /function ([$\w]+)/.exec(type);
    if (match && match[1]) type = match[1];
    if (!type) type = Type;
    invalid = true;
    // throw new TypeError(`unsupported type [${sType}]${where}`);
  }
  return { type, Type, default: defaultVal, invalid };
}


module.exports = parseType;
