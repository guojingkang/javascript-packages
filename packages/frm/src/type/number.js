

// map to data type: decimal(length, scale) in mysql
// default length 10, default scale 0

module.exports = NumberFieldType;

const util = require('util');
const FieldType = require('../type');
let FrmError = require('../error'),
  NormalizeError = FrmError.NormalizeError;

function NumberFieldType() {
  FieldType.apply(this, arguments);
  if (!(this.props.precision > 0)) this.props.precision = 15;
  if (!(this.props.scale > 0)) this.props.scale = 0;
  if (!this.props.rounding) this.props.rounding = 'round'; // TODO round/floor/ceil
}
util.inherits(NumberFieldType, FieldType);
const proto = NumberFieldType.prototype;

NumberFieldType.toString = NumberFieldType.inspect = function () {
  return '<#NumberFieldType>';
};

proto._normalize = function (value, options) {
  if (options.get) return value;
  if (!value && value !== 0) return null;
  if (value instanceof Date) value = value.getTime();
  value = (`${value}`).replace(',', '');
  value = parseFloat(value);
  if (isNaN(value)) return null;
  if (value === 0) return 0;

  const scale = this.props.scale;// the decimal part length
  if (scale) {
    if (value > 0) value = Math.round(value * Math.pow(10, scale)) / Math.pow(10, scale);
    else value = -Math.round(Math.abs(value) * Math.pow(10, scale)) / Math.pow(10, scale);
  }
  if (isNaN(value)) return null;
  if (value === 0) return 0;

  let parts = (`${value}`).split('.'),
    intPart = parts[0],
    decPart = parts[1] ? `.${parts[1]}` : '';
  const over = intPart.replace('-', '').length - (this.props.precision - scale);
  if (over > 0) {
    if (this.props.truncate) {
      if (value < 0) value = -(intPart.slice(over + 1) + decPart);
      else value = +(intPart.slice(over + 1) + decPart);
    } else throw new NormalizeError(this.model.name, 'field %s overflowed with value %s', this.name, value);
  }

  return value;
};

proto.toSQL = function () {
  const scale = this.props.scale;
  const len = this.props.precision;
  const type = util.format('decimal(%s,%s)', len, scale);
  return this._toSQL(type);
};
