

module.exports = BooleanFieldType;

const util = require('util');
const FieldType = require('../type');

function BooleanFieldType() {
  FieldType.apply(this, arguments);
}
util.inherits(BooleanFieldType, FieldType);
const proto = BooleanFieldType.prototype;

BooleanFieldType.toString = BooleanFieldType.inspect = function () {
  return '<#BooleanFieldType>';
};

proto._normalize = function (value, options) {
  if (value === true) return value;
  if (!value) return false;
  if (value === '0' || value === '*0*') return false;
  if (typeof value === 'string') {
    value = value.toLowerCase();
    if (value === 'false' || value === '*false*') return false;
  }
  return true;
};

proto.toSQL = function () {
  if (this.props.category !== 'entity') return null;
  const column = this.model.frm.connection.escapeId(this.props.column);
  return [column, 'tinyint(1) NOT NULL DEFAULT 0'].join(' ');
};
