

exports.save = saveRecord;
exports.remove = removeRecord;

const util = require('../util');
const Type = require('../type');
const builder = require('../builder');
let FrmError = require('../error'),
  ValidationError = FrmError.ValidationError,
  QueryError = FrmError.QueryError;
const debug = require('debug')('frm');

// this = record
function saveRecord(options) {
  const model = this.model,
    conn = model.frm.connection;
  const fields = model.def.fields;
  options = options || {};

  debug('beg to save on model %s', model.name);
  if (!this.id) return Promise.reject(new QueryError(model.name, 'unable to save a record with empty id field'));

  if (!this.isNew && util.isEmptyObject(this._changed)) {
    return Promise.resolve().then(() => debug('end to save on model %s for no changes', model.name));
  }

  util.checkBeforeSave(this);

  let prom;

  // write to the db table
  let savedBy = options.savedBy,
    sql;
  if (this.isNew) { // insert
    if (fields.createdBy && savedBy) this.createdBy = savedBy;

    sql = builder.insert(model, this._data);
    prom = conn.query(sql).then(() => {
      Object.defineProperty(this, 'isNew', { configurable: false, value: false });
    });
  } else { // update
    if (fields.updatedBy && savedBy) this.updatedBy = savedBy;

    const filter = { id: this._data.id };
    const changed = Object.assign({}, this._changed);
    if (fields.updatedAt && !changed.updatedAt) { // if has updatedAt field and not be set
      changed.updatedAt = fields.updatedAt.normalize(Date.now());
    }

    // check version
    const hasVersioned = options.versionCheck && fields.version;
    if (hasVersioned) {
      const oldVersion = this.version || 0;
      filter.version = oldVersion;
      changed.version = oldVersion + 1;
    }

    sql = builder.update(model, changed, filter);
    prom = conn.query(sql).then((result) => {
      if (!result.affectedRows && hasVersioned) { // should = 1
        throw new QueryError(model.name, 'unable to save: record may be changed after last retrieve, please query the record again');
      }

      Object.assign(this._data, changed);
      Object.defineProperty(this, '_changed', { configurable: true, value: {} });// empty the changed
    });
  }

  return prom.then(() => {
    debug('end to save on model %s', model.name);
    return this;
  }).catch(e => util.parseError(model, e));
}

function removeRecord(options) {
  const model = this.model,
    conn = model.frm.connection;
  if (this.isNew) return;

  debug('beg to remove on model %s', model.name);
  options || (options = {});

  const filter = { id: this._data.id };

  // check version
  const hasVersioned = options.versionCheck && model.def.fields.version;
  if (hasVersioned) {
    filter.version = this._data.version || 0;
  }

  const sql = builder.delete(model, filter);
  return conn.query(sql).then((result) => {
    if (!result.affectedRows && hasVersioned) {
      throw new QueryError(model.name, 'unable to remove: record may be changed after last retrieve, please query the record again');
    }
    debug('end to remove on model %s', model.name);
  });
}
