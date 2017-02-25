

module.exports = StringFieldType;

const util = require('util');
const xss = require('xss');
const FieldType = require('../type');
const FrmError = require('../error'),
  InvalidDefinitionError = FrmError.InvalidDefinitionError,
  NormalizeError = FrmError.NormalizeError;

// length for character, not byte
const TINYTEXT_SIZE = 255;// 2^8-1
const TEXT_SIZE = 65535;// 2^16-1, 64K-1
const MEDIUMTEXT_SIZE = 16777215;// 2^24-1, 16M-1
const LONGTEXT_SIZE = 4294967295;// 2^32-1, 4G-1
const VARCHAR_MAX = 5000;// 16383;
const DEFAULT_PROPS = { length: TINYTEXT_SIZE, big: false, truncate: false,
  bmp: false, //true for only Basic Multilingual Plane, just support utf-16, not 32-bit unicode, like emojis
};

function StringFieldType() {
  FieldType.apply(this, arguments);
  if (!(this.props.length > 0)) {
    if (!this.props.big) this.props.length = TINYTEXT_SIZE;// default length
    else this.props.length = TEXT_SIZE;
  }

  const len = this.props.length;
  this.props.big = false;
  if (len > VARCHAR_MAX) this.props.big = true;
  if (len > LONGTEXT_SIZE) {
    throw new InvalidDefinitionError(this.model.name, 'field %s length %s is too big', this.name, len);
  }
}
StringFieldType.TINYTEXT_SIZE = TINYTEXT_SIZE;
StringFieldType.TEXT_SIZE = TEXT_SIZE;
StringFieldType.MEDIUMTEXT_SIZE = MEDIUMTEXT_SIZE;
StringFieldType.LONGTEXT_SIZE = LONGTEXT_SIZE;

util.inherits(StringFieldType, FieldType);
const proto = StringFieldType.prototype;

StringFieldType.toString = StringFieldType.inspect = function () {
  return '<#StringFieldType>';
};

proto._normalize = function (value, options) {
  if (options.get) return value;
  if (typeof value === 'undefined' || value === null || value === '') return null;
  else {
    if (typeof value !== 'string') {
      value += '';
    }
    value = value.trim();

    if (options.set) {
      // check bmp=true
      if (this.props.bmp) {
        const surrogates = /[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
        value = value.replace(surrogates, '');
      }

      const len = this.props.length;
      if (value.length > len) {
        if (this.props.truncate) value = value.substring(0, len);
        else throw new NormalizeError(this.model.name, 'field %s overflowed', this.name);
      }

      if (value && this.props.xss) {
        value = toXss(value);
      }
    }

    if (!value) return null;
    return value;
  }
};

proto.toSQL = function () {
  const len = this.props.length;// max length
  let big = this.props.big,
    bmp = this.props.bmp;
  let type;
  if (big) {
    if (len <= TINYTEXT_SIZE) type = 'tinytext';
    else if (len <= TEXT_SIZE) type = 'text';
    else if (len <= MEDIUMTEXT_SIZE) type = 'mediumtext';
    else if (len <= LONGTEXT_SIZE) type = 'longtext';
  }  else type = util.format('varchar(%s)', len);
  return this._toSQL(`${type} character set ${!bmp ? 'utf8mb4':'utf8'}`);
};

function toXss(val) {
  return xss(val, {
    onTagAttr(tag, name, value, isWhiteAttr) {
      if (tag === 'img' && name === 'src' && value.substring(0, 11) === 'data:image/') {
        return `src="${value}"`;
      }
    },
  });
}
