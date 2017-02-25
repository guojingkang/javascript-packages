

module.exports = constructRecord;

const util = require('../util');
const methods = require('./methods');
const debug = require('debug')('frm');
let FrmError = require('../error'),
  QueryError = FrmError.QueryError;

const proto = {
  toString,
  inspect,
  toJSON,
  copy: require('./create').copy,
  save: methods.save,
  remove: methods.remove,
};

function constructRecord(model, row, activeFields, isNew) {
  const fields = model.def.fields;
  for (const fieldName in row) {
    const field = fields[fieldName];
    if (!field) throw new QueryError(model.name, 'field %s not found on create record', fieldName);
    row[fieldName] = field.normalize(row[fieldName], { set: isNew, get: !isNew });
  }

  resolveRefs(model, activeFields, row);

  const record = Object.create(getPrototype(model), {
    model: { value: model },
    fields: { value: activeFields }, // array
    isNew: {
      configurable: !!isNew,
      value: !!isNew,
    },
    _data: { value: row },
    _changed: { // only for not-new record
      configurable: true,
      value: {},
    },
  });
  return record;
}

// get model specified record prototype
function getPrototype(model) {
  if (model.__recordPrototype) return model.__recordPrototype;

  const mrProto = Object.assign({}, proto);// eslint-disable-line no-use-before-define
  const extraProperties = {};
  Object.keys(model.def.fields).forEach((fieldName) => {
    extraProperties[fieldName] = {
      enumerable: true,
      get() {
        const value = getf.call(this, fieldName);
        return value;
      },
      set(value) {
        return setf.call(this, fieldName, value);
      },
    };
  });
  Object.defineProperties(mrProto, extraProperties);
  model.__recordPrototype = mrProto;
  return mrProto;
}

function setf(fieldName, fieldValue) {
  const model = this.model;

  const field = model.def.fields[fieldName];
  fieldValue = field.normalize(fieldValue, { set: true });
  const category = field.props.category;

  if (category === 'virtual') {
    this._data[fieldName] = fieldValue;
    return this;
  }

  // join/ref field, set the value directly
  if (category !== 'entity') {
    this._data[fieldName] = fieldValue;
    return this;
  }

  // entity field
  const isEqual = field.compare(fieldValue, this._data[fieldName]);

  if (this.isNew) { // new record, set on the `data` directly
    if (!isEqual) this._data[fieldName] = fieldValue;
  } else { // not-new record, set on the `changed`
    const chg = this._changed;
    if (isEqual) {
      if (chg) delete chg[fieldName];
    } else chg[fieldName] = fieldValue;
  }

  return this;
}

function getf(fieldName) {
  const model = this.model;
  const field = model.def.fields[fieldName];
  const category = field.props.category;

  if (category === 'virtual') {
    // no need to normalize, for its value is always from set
    return this._data[fieldName];
  }

  // if entity field, check if exists in changed.
  if (category === 'entity') {
    if (this._changed.hasOwnProperty(fieldName)) {
      return field.normalize(this._changed[fieldName], { get: true });
    } else if (this._data.hasOwnProperty(fieldName)) {
      return field.normalize(this._data[fieldName], { get: true });
    } else {
      return undefined;
    }
  }

  // other class(ref/join) fields.
  if (this._data.hasOwnProperty(fieldName)) {
    return field.normalize(this._data[fieldName], { get: true });
  } else return undefined;
}

function resolveRefs(model, activeFields, row) {
  if (!row) return;

  const refs = {};
  for (const fi in activeFields) {
    const fieldName = activeFields[fi];
    const field = model.def.fields[fieldName];
    if (field.props.category !== 'ref') continue;
    refs[field.props.ref] = model.def.refs[field.ref];
  }

  if (util.isEmptyObject(refs)) return;

  const resolved = {};// resolved refs
  for (const refName in refs) {
    const ref = refs[refName];
    resolveRef(model, activeFields, row, ref, resolved);
  }
}
function resolveRef(model, activeFields, row, ref, resolved) {
  if (resolved[ref.name]) return;
  resolved[ref.name] = true;

  const refName = ref.name;
  const RefModel = ref.model;

  const refFieldsMap = {};// <this model field>:<ref model field>
  let refActiveFields = {};// ref model should activate fields
  for (const fi in activeFields) {
    const fieldName = activeFields[fi];
    const field = model.def.fields[fieldName];
    if (field.props.category === 'ref' && field.props.ref === refName) {
      refFieldsMap[fieldName] = field.props.column;
      refActiveFields[field.props.column] = true;
    }
  }
  if (util.isEmptyObject(refFieldsMap)) return;
  refActiveFields = Object.keys(refActiveFields);// to array

  let filter = {},
    thisFieldName;

  for (const oi in ref.on) {
    const on = ref.on[oi];
    if (on.type === 'field') {
      thisFieldName = on.target;
      const thisField = model.def.fields[thisFieldName];
      if (thisField.ref && !resolved[thisField.ref]) {
        resolveRef(model, activeFields, row, model.def.refs[thisField.ref], resolved);
      }
      filter[on.field] = row[thisFieldName];
    } else if (on.type === 'literal') {
      filter[on.field] = on.target;
    }
  }

  debug('to do a query of ref %s on model %s', refName, model.name);
  const refRecord = RefModel.queryOne(refActiveFields, filter);
  if (!refRecord) return;

  for (thisFieldName in refFieldsMap) {
    row[thisFieldName] = refRecord[refFieldsMap[thisFieldName]];
  }
}

function toString() {
  calcRemain.call(this);
  return util.format(this._data);
}
function inspect() {
  calcRemain.call(this);
  return util.inspect(this._data);
}
function toJSON() {
  calcRemain.call(this);
  return this._data;
}

function calcRemain() {
  const model = this.model;
  const fields = model.def.fields;
  for (const ii in this.fields) {
    const fieldName = this.fields[ii];
    const field = fields[fieldName];
    if (this._data.hasOwnProperty(fieldName)) continue;
    if (field.props.category === 'virtual') {
      getf.call(this, fieldName);
    }
  }
}
