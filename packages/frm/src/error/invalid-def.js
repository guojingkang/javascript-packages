

module.exports = exports = InvalidDefinitionError;

const util = require('util');
const FrmError = require('../error');
const slice = Array.prototype.slice;

function InvalidDefinitionError(modelName, msg) {
  Error.captureStackTrace(this, InvalidDefinitionError);
  this.message = `invalid definition on model ${modelName}: ${
    util.format.apply(null, slice.call(arguments, 1))}`;
  this.name = 'InvalidDefinitionError';
}
util.inherits(InvalidDefinitionError, FrmError);
