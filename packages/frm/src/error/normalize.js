

module.exports = exports = NormalizeError;

const util = require('util');
const FrmError = require('../error');
const slice = Array.prototype.slice;

function NormalizeError(modelName, msg) {
  Error.captureStackTrace(this, NormalizeError);
  this.message = `error to normalize on model ${modelName}: ${
    util.format.apply(null, slice.call(arguments, 1))}`;
  this.name = 'NormalizeError';
}
util.inherits(NormalizeError, FrmError);
