/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, func-names, import/no-unresolved, import/no-extraneous-dependencies */
/* eslint no-prototype-builtins:off */

const assert = require('assert');
const parseType = require('../dist/structures/parse-type');
const { Map: Map2, createMap } = require('../dist/structures/map');
const { List, createList } = require('../dist/structures/list');
const { Model, createModel } = require('../dist/structures/model');

describe('parseType()', function () {
  it('should work with supported type', function () {
    assert.deepStrictEqual(parseType(null), { type: 'undefined', Type: undefined, default: null, invalid: false });
    assert.deepStrictEqual(parseType(undefined), { type: 'undefined', Type: undefined, default: null, invalid: false });
    assert.deepStrictEqual(parseType(0), { type: 'number', Type: Number, default: 0, invalid: false });
    assert.deepStrictEqual(parseType(''), { type: 'string', Type: String, default: '', invalid: false });
    assert.deepStrictEqual(parseType(false), { type: 'boolean', Type: Boolean, default: false, invalid: false });

    assert.deepStrictEqual(parseType(Number), { type: 'number', Type: Number, default: null, invalid: false });
    assert.deepStrictEqual(parseType(String), { type: 'string', Type: String, default: null, invalid: false });
    assert.deepStrictEqual(parseType(Boolean), { type: 'boolean', Type: Boolean, default: null, invalid: false });

    compareComplexType({}, Map2, { type: 'map', default: null, invalid: false });
    compareComplexType(createMap(), Map2, { type: 'map', default: null, invalid: false });

    compareComplexType(createList(), List, { type: 'list', default: null, invalid: false });

    compareComplexType(createModel('User'), Model, { type: 'model', default: null, invalid: false });
  });
  it('should throw with invalid type', function () {
    assert.deepStrictEqual(parseType([]), { type: 'Array', Type: Array, default: null, invalid: true });
    assert.deepStrictEqual(parseType(Date), { type: 'Date', Type: Date, default: null, invalid: true });
    assert.deepStrictEqual(parseType(RegExp), { type: 'RegExp', Type: RegExp, default: null, invalid: true });
    assert.deepStrictEqual(parseType(Buffer), { type: 'Buffer', Type: Buffer, default: null, invalid: true });
  });
});

function compareComplexType(inputType, expectedSuperClass, expectedResult) {
  const { type, Type, default: def, invalid } = parseType(inputType);
  assert(expectedSuperClass.isPrototypeOf(Type), Type);
  assert.deepStrictEqual({ type, default: def, invalid }, expectedResult);
}
