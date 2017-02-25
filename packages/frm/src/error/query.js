

module.exports = exports = QueryError;

const util = require('util');
const FrmError = require('../error');
const slice = Array.prototype.slice;

function QueryError(modelName, msg) {
  Error.captureStackTrace(this, QueryError);
  this.message = `error to query on model ${modelName}: ${
    util.format.apply(null, slice.call(arguments, 1))}`;
  this.name = 'QueryError';
}
util.inherits(QueryError, FrmError);
