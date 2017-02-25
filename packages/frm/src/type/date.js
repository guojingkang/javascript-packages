

module.exports = DateFieldType;

const util = require('util');
const lutil = require('../util');
const FieldType = require('../type');

Date.prototype.toString = Date.prototype.inspect = Date.prototype.toJSON = function () {
  return lutil.formatDate(this, this._field && this._field.props.pattern);
};

function DateFieldType() {
  FieldType.apply(this, arguments);
  if (!this.props.pattern) this.props.pattern = 'datetime';
}
util.inherits(DateFieldType, FieldType);
const proto = DateFieldType.prototype;

DateFieldType.toString = DateFieldType.inspect = function () {
  return '<#DateFieldType>';
};

// always clone the value when get field value
proto._normalize = function (value, options) {
  if (!value) return null;
  if (value instanceof Date) {
    if (options.set || options.get) {
      return clone(this, value);
    }
    return value;
  } else if (typeof value === 'number') {
    const dt = new Date();
    dt.setTime(value);
    return dt;
  } else {
    if (typeof value !== 'string') value += '';

    if (value === 'now') {
      return new Date();
    }
    return lutil.parseDate(value);
  }
};

proto.compare = function (newValue, oldValue) {
  if (newValue === oldValue) return true;
  if (!newValue && !oldValue) return true;
  if (!newValue || !oldValue) return false;
  if (~~(newValue.getTime() / 1000) === ~~(oldValue.getTime() / 1000)) return true;
  return false;
};

proto.toSQL = function () {
  const pattern = this.props.pattern.toLowerCase();
  let type = 'datetime';
  if (pattern.toLowerCase() === 'date') type = 'date';
  else if (pattern.toLowerCase() === 'time') type = 'time';
  return this._toSQL(type);
};

function clone(field, dt) {
  if (!dt) return null;
  const r = new Date();
  r._field = field;
  r.setTime(dt.getTime());

  const pattern = field.props.pattern;
  if (pattern === 'date') {
    r.setHours(0, 0, 0, 0);
  // }
  // else if(pattern==='datettime'){
  //   r.setMilliseconds(0)
  } else {
    r.setMilliseconds(0); // avoid mysql to round the seconds according to the ms
  }
  return r;
}
