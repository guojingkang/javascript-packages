

module.exports = exports = ValidationError;

const util = require('util');
const FrmError = require('../error');
const slice = Array.prototype.slice;

function ValidationError(modelName, msg) {
  Error.captureStackTrace(this, ValidationError);
  this.message = `validation failed on model ${modelName}: ${
    util.format.apply(null, slice.call(arguments, 1))}`;
  this.name = 'ValidationError';
}
util.inherits(ValidationError, FrmError);
