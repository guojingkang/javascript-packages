

module.exports = exports = FrmError;

const util = require('util');

function FrmError(msg) {
  Error.captureStackTrace(this, FrmError);
  this.message = util.format.apply(null, arguments);
  this.name = 'FrmError';
}
util.inherits(FrmError, Error);

FrmError.InvalidDefinitionError = require('./error/invalid-def');
FrmError.NormalizeError = require('./error/normalize');
FrmError.QueryError = require('./error/query');
FrmError.ValidationError = require('./error/validation');
