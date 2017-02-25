
const Buffer = require('buffer').Buffer;// eslint-disable-line no-shadow

exports.encode = function encode(str) {
  if (Buffer.isBuffer(str)) return str.toString('base64');
  if (typeof str !== 'string') throw new TypeError('String or Buffer type required in base64 encode');
  if (!str) return str;
  return new Buffer(str).toString('base64');
};

exports.decode = function decode(str, encoding) {
  if (typeof str !== 'string') throw new TypeError('String type required in base64 decode');
  return new Buffer(str, 'base64').toString(encoding || 'utf8');
};

exports.encodeURL = function encodeURL(str) {
  str = exports.encode(str);
  if (!str) return str;
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

exports.decodeURL = function decodeURL(str) {
  if (typeof str !== 'string') throw new TypeError('String type required in base64 decodeURL');
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  str += Array(5 - str.length % 4).join('=');
  return exports.decode(str);
};
