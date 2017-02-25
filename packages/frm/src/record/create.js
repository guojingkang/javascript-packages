

exports.create = createRecord;
exports.copy = copyRecord;

const constructRecord = require('./construct');
const util = require('../util');
const debug = require('debug')('frm');

// this = model
function createRecord(fvs, options) {
  options || (options = {});
  const model = this;

  const row = {};
  if (fvs) {
    for (const kk in fvs) {
      row[kk] = fvs[kk];
    }
  }
  const r = constructRecord(model, row, Object.keys(model.def.fields), true);
  getDefaultOnCreate(r, null, options.createdBy);
  return r;
}

// this = record
function copyRecord(fvs, options) {
  options || (options = {});
  const model = this.model;
  debug('beg to copy on model %s', model.name);

  let row = {},
    template = Object.assign({}, this._data, this._changed);
  if (fvs) {
    for (const kk in fvs) {
      row[kk] = fvs[kk];
    }
  }
  const r = constructRecord(model, row, Object.keys(model.def.fields), true);
  getDefaultOnCreate(r, template, options.createdBy);
  debug('end to copy on model %s', model.name);
  return r;
}

function getDefaultOnCreate(record, template, loginName) {
  const model = record.model;

  const fields = model.def.fields;
  const id = record._data.id;
  Object.keys(fields).map((fieldName) => {
    const field = fields[fieldName];
    const category = field.props.category;

    if (category === 'virtual') return;
    let value = record._data[fieldName];
    if (value || value === 0 || value === false) return;// already set

    // empty value
    if (template) {
      if (!field.props.noCopy) value = template[fieldName];
    }

    // calculate the default value
    if (fieldName === 'createdAt') value = Date.now();
    else if (fieldName === 'createdBy') value = loginName;
    else if (fieldName === 'version') value = 0;
    else if (!value && value !== 0 && field.props.hasOwnProperty('prevDefault')) {
      const prevDefault = field.props.prevDefault;
      if (typeof prevDefault === 'function') {
        value = prevDefault.call(record);
      } else value = prevDefault;
    }

    record._data[fieldName] = field.normalize(value);
  });
  if (!id) record._data.id = fields.id.normalize(util.uid(model.name, record._data));
}
