

module.exports = BufferFieldType;

const util = require('util');
const FieldType = require('../type');

function BufferFieldType() {
  FieldType.apply(this, arguments);
}
util.inherits(BufferFieldType, FieldType);
const proto = BufferFieldType.prototype;

BufferFieldType.toString = BufferFieldType.inspect = function () {
  return '<#BufferFieldType>';
};

proto._normalize = function (value, options) {
  // TODO length limited
  if (options.get) return value;
  if (!value) return null;

  if (typeof value === 'string') value = new Buffer(value);
  if (Buffer.isBuffer(value)) return value;
  return null;
};

proto.toSQL = function () {
  const len = this.props.length;// max length
  let type = 'varbinary(%s)';
  if (!len) type = 'blob';
  else type = util.format(type, len);
  return this._toSQL(type);
};
