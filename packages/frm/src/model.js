

module.exports = exports = Model;

const util = require('./util');
const Definition = require('./definition');
const builder = require('./builder');
const Type = require('./type');
const createRecord = require('./record/create').create;
const constructRecord = require('./record/construct');
const FrmError = require('./error'),
  QueryError = FrmError.QueryError;
const debug = require('debug')('frm');

function Model(frm, name, fields, options) {
  this.frm = frm;
  this.name = name;
  this.def = new Definition(this, fields, options);
}
const proto = Model.prototype;

proto.toString = proto.inspect = function () {
  return util.format('<#Model %s>', this.name);
};

proto.count = function (filter) {
  debug('begin to count on model %s', this.name);

  const sql = builder.count(this, parseFilter(this, filter));
  return this.frm.query(sql).then((result) => {
    debug('end to count on model %s', this.name);
    return result[0].cnt || 0;
  });
};

proto.exists = function (filter) {
  const params = { offset: 0, limit: 1, filter };
  return find.call(this, params).then(rs => rs.length > 0);
};

proto.findOne = function (params) {
  params || (params = {});
  params.offset = 0, params.limit = 1;
  return find.call(this, params).then(rs => rs.length > 0 ? rs[0] : null);
};

proto.findById = function (params) {
  params || (params = {});
  params.filter = { id: params.id };
  params.sort = null, params.offset = 0, params.limit = 1;
  return find.call(this, params).then(rs => rs.length > 0 ? rs[0] : null);
};

proto.find = function (params) {
  return find.call(this, params).then(rs => wrapResultSet(rs));
};

proto.findAll = function (params, cb) {
  if (typeof cb !== 'function') return Promise.reject(new TypeError('callback need be a function'));

  const pageSize = params.pageSize || 20;// 每页大小
  const limit = ~~(+params.limit) || 0;// 总数限制

  const findOnePage = (offset) => {
    let findLimit = pageSize;
    if (limit > 0) {
      findLimit = Math.min(limit - offset, pageSize);
      if (findLimit <= 0) return;
    }

    const findParams = Object.assign({}, params, { offset, limit: findLimit });
    return this.find(findParams).then(rs => Promise.resolve(cb(rs)).then(() => {
      if (rs.length < pageSize) return;// no more records
      return findOnePage(offset + pageSize);
    }));
  };
  return findOnePage(0);
};

function find(params) {
  params || (params = {});
  debug('begin to query on model %s', this.name);

  if (!params.fields) params.fields = true;
  const activeFields = builder.activateField(this, params.fields);// array of field name

  const filter = parseFilter(this, params.filter);
  let sort = params.sort;
  if (sort) sort = builder.normSort(this, sort);
  sort = Object.assign({}, sort, this.def.sort);

  // get the rows
  const sql = builder.select(this, activeFields, filter, sort, params);
  return this.frm.query(sql).then((rows) => {
    const rs = rows.map(row => constructRecord(this, row, activeFields));

    debug('end to query on model %s', this.name);
    return rs;
  });
}

proto.create = function (fvs, options) {
  debug('beg to create on model %s', this.name);
  const r = createRecord.call(this, fvs, options);
  debug('end to create on model %s', this.name);
  return r;
};

// support batch insert(array) and single insert(object)
proto.insert = function (fvs, options) {
  let rs = Array.isArray(fvs) ? fvs : [fvs];
  if (rs.length <= 1) {
    return this.create(rs[0], options).save();
  }

  debug('begin to insert on model %s', this.name);

  rs = rs.map((r) => {
    r = createRecord.call(this, r, options);
    util.checkBeforeSave(r);
    return r;
  });
  const sql = builder.insert(this, rs);
  return this.frm.query(sql).then((result) => {
    rs.forEach((r) => {
      Object.defineProperty(r, 'isNew', { configurable: false, value: false });
    });

    debug('end to insert on model %s', this.name);
    return wrapResultSet(rs);
  }).catch(e => util.parseError(this, e));
};

// update directly
proto.update = function (params) {
  debug('begin to update on model %s', this.name);

  params || (params = {});
  let set = params.set,
    filter = params.filter,
    sort = params.sort,
    limit = params.limit;

  if (!set || util.isEmptyObject(set) || !filter) {
    throw new QueryError(this.name, 'set and filter required in update');
  }
  set = normFields(this, set, 'update');

  const normFilter = parseFilter(this, filter);

  if (sort) sort = builder.normSort(this, sort);

  const sql = builder.update(this, set, normFilter, sort, limit);
  return this.frm.query(sql).then((result) => {
    debug('end to update on model %s', this.name);
    return result.affectedRows || 0;
  }).catch(e => util.parseError(this, e));
};

// delete directly
proto.remove = function (params) {
  debug('begin to remove on model %s', this.name);

  params || (params = {});
  let set = params.set,
    filter = params.filter,
    sort = params.sort,
    limit = params.limit;

  const normFilter = parseFilter(this, filter);
  if (sort) sort = builder.normSort(this, sort);

  if (!filter) throw new QueryError(this.name, 'filter required in remove');
  const sql = builder.delete(this, normFilter, sort, limit);
  return this.frm.query(sql).then((result) => {
    debug('end to remove on model %s', this.name);
    return result.affectedRows || 0;
  });
};

// increase/decrease the field value, only for number type field
// set: {<field>: <num>}
proto.increase = function (params) {
  debug('begin to increase on model %s', this.name);

  params || (params = {});
  let set = params.set,
    filter = params.filter,
    sort = params.sort,
    limit = params.limit;

  if (!set || util.isEmptyObject(set) || !filter) {
    throw new QueryError(this.name, 'set and filter required in increase');
  }
  const fields = this.def.fields;
  for (const fieldName in set) {
    const field = fields[fieldName];
    if (!field) {
      throw new QueryError(this.name, 'nonexistent field %s in increase', fieldName);
    }
    if (field.props.category !== 'entity') {
      throw new QueryError(this.name, 'field %s is not an entity field in increase', fieldName);
    }
    if (field.props.type !== Type.types.Number && field.props.type !== Type.types.Integer) {
      throw new QueryError(this.name, 'field %s\'s type is not Number/Integer', fieldName);
    }
  }
  set = normFields(this, set, 'increase');
  const normFilter = parseFilter(this, filter);

  if (sort) sort = builder.normSort(this, sort);

  const sql = builder.increase(this, set, normFilter, sort, limit);
  return this.frm.query(sql).then((result) => {
    debug('end to increase on model %s', this.name);
    return result.affectedRows || 0;
  }).catch(e => util.parseError(this, e));
};

// get the max of the field value, only for number type field
// proto.max = function(fieldName, filter){
//   debug('begin to query max on model %s', this.name);

//   if(!fieldName)
//     throw new Error('error to query max on model %s: no field argument', this.name);
//   var f = this.def.fields[fieldName];
//   if(!f) throw new Error('error to query max on model %s: nonexistent field %s', this.name, fieldName);
//   if(field.props.type!=='number')
//     throw new Error('error to query max on model %s: field %s type is not number', this.name, fieldName);
//   var normFilter = filter?parseFilter(this, filter): filter;

//   if(this.proxy){
//     return this.proxy.count?this.proxy.count.call(this, fieldName, normFilter)||0: 0;
//   }

//   var sql = builder.getMaxSql(this, field.column, normFilter);
//   var result = this.frm.query(sql);
//   debug('end to query max on model %s', this.name);
//   return result[0].value || 0;
// };

function parseFilter(model, filter) {
  let merged = null;
  if (util.isEmptyObject(model.def.filter)) {
    merged = filter;
  } else if (util.isEmptyObject(filter)) {
    merged = model.def.filter;
  } else {
    merged = { $and: [model.def.filter, filter] };
  }
  return builder.normFilter(model, merged);
}

function wrapResultSet(rs) {
  if (!rs || rs.hasOwnProperty('toJSON')) return rs;
  Object.defineProperties(rs, {
    toJSON: { value() {
      const newrs = [];
      if (this.length === 0) return newrs;
      for (const ii in this) {
        const r = this[ii];
        if (r.model) newrs.push(r.toJSON());// model record
        else newrs.push(r);// normal object
      }
      return newrs;
    } },
    inspect: { value() {
      return util.inspect(this.toJSON());
    } },
  });
  return rs;
}

function normFields(model, fvs, action) {
  const fields = model.def.fields;
  for (const fieldName in fvs) {
    const field = fields[fieldName];
    if (!field) throw new QueryError(model.name, 'nonexistent field %s in %s', fieldName, action);
    fvs[fieldName] = field.normalize(fvs[fieldName]);
  }
  return fvs;
}
