

// map to data type: TINYINT/SMALLINT/MEDIUMINT/INT/BIGINT in mysql
// length: bytes number, 1/2/3/4/8, default 4

module.exports = IntegerFieldType;

const util = require('util');
const FieldType = require('../type');
let FrmError = require('../error'),
  InvalidDefinitionError = FrmError.InvalidDefinitionError,
  NormalizeError = FrmError.NormalizeError;

const TYPES = { 1: 'tinyint', 2: 'smallint', 3: 'mediumint', 4: 'int', 8: 'bigint' };
const MAX = { 1: 127, 2: 32767, 3: 8388607, 4: 2147483647, 8: 9.22337203685478e+18 };
const MIN = { 1: -128, 2: -32768, 3: -8388608, 4: -2147483648, 8: -9.22337203685478e+18 };

function IntegerFieldType() {
  FieldType.apply(this, arguments);
  if (!(this.props.length > 0)) this.props.length = 4;
  const len = this.props.length;
  if (!TYPES[len]) { throw new InvalidDefinitionError(this.model.name, 'field %s length should be 1/2/3/4/8', this.name); }
}
util.inherits(IntegerFieldType, FieldType);
const proto = IntegerFieldType.prototype;

IntegerFieldType.toString = IntegerFieldType.inspect = function () {
  return '<#IntegerFieldType>';
};

proto._normalize = function (value, options) {
  if (options.get) return value;
  if (!value && value !== 0) return null;
  if (value instanceof Date) value = value.getTime();
  value = (`${value}`).replace(',', '');
  value = parseInt(value);
  if (isNaN(value)) return null;

  const len = this.props.length;
  if (value > MAX[len] || value < MIN[len]) {
    throw new NormalizeError(this.model.name, 'field %s overflowed with value %s', this.name, value);
  }

  return value;
};

proto.toSQL = function () {
  const len = this.props.length;
  return this._toSQL(TYPES[len]);
};
