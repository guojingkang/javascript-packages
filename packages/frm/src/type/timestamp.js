

// map to data type: TINYINT/SMALLINT/MEDIUMINT/INT/BIGINT in mysql
// length: bytes number, 1/2/3/4/8, default 4

module.exports = TimestampFieldType;

const util = require('util');
const FieldType = require('../type');

function TimestampFieldType() {
  FieldType.apply(this, arguments);
}
util.inherits(TimestampFieldType, FieldType);
const proto = TimestampFieldType.prototype;

TimestampFieldType.toString = TimestampFieldType.inspect = function () {
  return '<#TimestampFieldType>';
};

proto._normalize = function (value, options) {
  if (options.get) return value;
  if (!value && value !== 0) return null;
  if (value instanceof Date) value = value.getTime();
  value = (`${value}`).replace(',', '');
  value = parseInt(value);
  if (isNaN(value)) return null;

  return value;
};

proto.toSQL = function () {
  return this._toSQL('bigint(20)');
};
