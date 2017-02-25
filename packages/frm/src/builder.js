

const Tree = require('tree-sort');
const util = require('./util');
const Model = require('./model');
let FrmError = require('./error'),
  QueryError = FrmError.QueryError;

// filter operators
var FILTER_OPS = {
  $eq(column, value, escapeId, escapeVal) {
    value = norm(value);
    if (value instanceof Array) {
      if (value.length > 1) return FILTER_OPS.$in(column, value, escapeId, escapeVal);
      else return FILTER_OPS.$eq(column, value.length < 1 ? null : value[0], escapeId, escapeVal);
    }

    if (value === null) {
      return `${escapeId(column)} is null`;
    }
    if (typeof value === 'string') {
      if (value.indexOf('*') >= 0) {
        value = value.replace(/\*/g, '%');
        return `${escapeId(column)} like ${escapeVal(value)}`;
      }
    }

    return `${escapeId(column)}=${escapeVal(value)}`;
  },
  $ne(column, value, escapeId, escapeVal) {
    value = norm(value);
    if (value === null) {
      return `${escapeId(column)} is not null`;
    }
    if (typeof value === 'string') {
      if (value.indexOf('*') >= 0) {
        value = value.replace('*', '%');
        return `${escapeId(column)} not like ${escapeVal(value)}`;
      }
    }
    if (value instanceof Array) {
      if (value.length > 1) return FILTER_OPS.$nin(column, value, escapeId, escapeVal);
      else return FILTER_OPS.$ne(column, value.length < 1 ? null : value[0], escapeId, escapeVal);
    }
    return `${escapeId(column)}<>${escapeVal(value)}`;
  },
  $in(column, values, escapeId, escapeVal) {
    if (!values || values.length === 0) values = [null];
    for (const i in values) {
      values[i] = norm(values[i]);
    }
    return `${escapeId(column)} in (${escapeVal(values)})`;
  },
  $nin(column, values, escapeId, escapeVal) {
    if (!values || values.length === 0) values = [null];
    for (const i in values) {
      values[i] = norm(values[i]);
    }
    return `${escapeId(column)} not in (${escapeVal(values)})`;
  },
  $gt: compare.bind(null, '>'),
  $lt: compare.bind(null, '<'),
  $ge: compare.bind(null, '>='),
  $le: compare.bind(null, '<='),
};

function norm(value) {
  if (value === null) {
    return value;
  } else if (value instanceof Date) {
    value = util.formatDate(value, value.pattern);
  } else if (typeof value === 'boolean') {
    value = value ? 1 : 0;
  }
  return value;
}
function compare(op, column, value, escapeId, escapeVal) {
  value = norm(value);
  if (value === null) {
    return null;
  }
  return escapeId(column) + op + escapeVal(value);
}

// normalize the field value in the filter
function normFilter(model, filter, fieldName) {
  if (!filter) return null;

  let result = {},
    fields = model.def.fields;
  for (const key in filter) {
    if (key === '$and' || key === '$or') { // {$and:[]}, {$or: []}
      const subfilters = [];
      for (const j in filter[key]) {
        const sub = normFilter(model, filter[key][j]);
        if (!sub) continue;
        subfilters.push(sub);
      }
      if (subfilters.length > 0) result[key] = subfilters;
      continue;
    }
    if (key.charAt(0) === '$') { // key is an operator, {op: value}
      if (!fieldName) {
        throw new QueryError(model.name, 'no field for operator %s in filter', key);
      }
      if (!fields[fieldName]) {
        throw new QueryError(model.name, 'nonexistent field %s in filter', fieldName);
      }
      result[key] = fields[fieldName].normalize(filter[key], { query: true });
      continue;
    }

    // key is a field, {field: value}, {field: {op: value, ...}}
    fieldName = key;
    const field = fields[key];
    if (!field) throw new QueryError(model.name, 'nonexistent field %s in filter', key);
    if (field.props.filterRedirect) {
      const proxyFields = field.props.filterRedirect.replace(/\s+/g, '').split(',');
      const proxyFilter = { $or: [] };
      for (const pi in proxyFields) {
        const proxyFieldName = proxyFields[pi];
        const fieldProxyFilter = {};
        fieldProxyFilter[proxyFieldName] = filter[key];
        proxyFilter.$or.push(fieldProxyFilter);
      }
      Object.assign(result, normFilter(model, proxyFilter));
      continue;
    }

    // {field: {op: value, ...}}
    if (util.isPlainObject(filter[key])) {
      result[fieldName] = normFilter(model, filter[key], fieldName);
      continue;
    }

    // {field: value}, value is not string
    let value = filter[key];
    if (typeof value !== 'string') { // array, date, int, float, bool, etc
      result[fieldName] = field.normalize(value, { query: true });
      continue;
    }

    // {field: value}, value is a plain string
    value = value.trim();
    if (!(value.substring(0, 1) === '{' && value.substr(-1) === '}')) {
      result[fieldName] = field.normalize(value, { query: true });
      continue;
    }

    // {field: value}, value is string and may contain a json object which is a query filter too
    const jsonExpr = null;
    try {
      eval('jsonExpr = '+value);//eslint-disable-line
    } catch (e) {}// eslint-disable-line no-empty
    if (!jsonExpr) { // parse fails, treat as plain string
      result[fieldName] = field.normalize(value, { query: true });
    } else {
      const jsonFilter = {};
      for (const jk in jsonExpr) {
        if (jk.charAt(0) === '$') { // expand {op:val} to {field:{op: val}}
          jsonFilter[fieldName] = {};
          jsonFilter[fieldName][jk] = jsonExpr[jk];
        } else { // {field: value}
          jsonFilter[jk] = jsonExpr[jk];
        }
      }
      result = Object.assign(result, normFilter(model, jsonFilter, fieldName));
    }
  }

  if (util.isEmptyObject(result)) return null;
  return result;
}

// 'name,-name'
// 'name,name asc,name desc'
const reSpace = /\s+/;
function normSort(model, sort) {
  if (!sort) return null;
  let result = {},
    fieldName,
    field,
    fields = model.def.fields;
  if (typeof sort === 'string') {
    const sortParts = sort.split(',');
    for (const pi in sortParts) {
      const sortPart = sortParts[pi].trim();
      const spaceParts = sortPart.split(reSpace);
      if (spaceParts[0].slice(0, 1) === '-') {
        fieldName = spaceParts[0].slice(1);
        result[fieldName] = 'desc';
      } else if (spaceParts.length === 1) {
        fieldName = sortPart;
        result[sortPart] = 'asc';
      } else {
        fieldName = spaceParts[0];
        if (spaceParts[1].toLowerCase() === 'desc') result[fieldName] = 'desc';
        else result[fieldName] = 'asc';
      }

      field = fields[fieldName];
      if (!field) {
        throw new QueryError(model.name, 'nonexistent field %s in sort', fieldName);
      }
      const cat = field.props.category;
      if (cat !== 'entity' && cat !== 'join') {
        throw new QueryError(model.name, 'invalid field %s in sort: only support entity/join field', fieldName);
      }
    }
    return result;
  } else {
    throw new QueryError(model.name, 'currently only support string type in sort');
  }
}

// parse the active fields, which will be used as select field list in sql statement
function activateField(model, fields) {
  let activeFields = [];
  if (fields === true) { // activate all
    return Object.keys(model.def.fields);
  } else if (Array.isArray(fields)) {
    activeFields = fields;
  } else if (typeof fields === 'string') {
    if (fields.indexOf('*') >= 0) { // activate all
      activeFields = Object.keys(model.def.fields);
    } else {
      activeFields = fields.trim().split(/\s*,\s*/);
    }
  }
  if (activeFields.length <= 0) throw new QueryError(model.name, 'fields required in find');

  // activate the related fields
  return Object.keys(activateRelatedFields(model, activeFields));
}
function activateRelatedFields(model, activeFields) {
  const result = {};
  const fields = model.def.fields;

  for (const fi in activeFields) {
    const fieldName = activeFields[fi];
    if (!fieldName) continue;
    result[fieldName] = true;

    const field = fields[fieldName];
    if (!field) throw new QueryError(model.name, 'error to activate field: not found field %s', fieldName);
    if (field.props.deps && field.props.deps.length > 0) {
      for (const ii in field.props.deps) {
        result[field.props.deps[ii]] = true;
      }
    }
  }
  return result;
}

function buildWhereSql(model, where, fieldName, usedJoins) {
  if (!where || util.isEmptyObject(where)) return null;

  const conditions = [];

  for (const key in where) {
    if (key === '$and' || key === '$or') {
      const subcons = [];
      for (const jj in where[key]) {
        const sub = buildWhereSql(model, where[key][jj], null, usedJoins);
        if (!sub) continue;
        subcons.push(sub);
      }

      if (subcons.length <= 0) continue;
      else if (subcons.length === 1) {
        conditions.push(subcons[0]);
      } else {
        conditions.push(`(${subcons.join(key === '$or' ? ' or ' : ' and ')})`);
      }
      continue;
    } else if (FILTER_OPS[key]) { // key is operator, {op: value}
      let field = model.def.fields[fieldName],
        fieldProps = field.props;
      if (!field) throw new QueryError(model.name, 'nonexistent field %s in filter', fieldName);
      if (fieldProps.category !== 'entity' && fieldProps.category !== 'join') {
        throw new QueryError(model.name, 'not allowed non-entity/join field %s in filter', fieldName);
      }
      if (fieldProps.join) {
        if (!usedJoins) {
          throw new QueryError(model.name, 'not allowed join field %s in this filter', fieldName);
        } else usedJoins[fieldProps.join] = 1;
      }

      const column = !usedJoins ? fieldProps.column : `${fieldProps.join ? model.def.joins[fieldProps.join].alias : model.def.alias}.${fieldProps.column}`;
      const expr = (FILTER_OPS[key])(column, where[key], model.frm.connection.escapeId, model.frm.connection.escape);
      if (!expr) continue;
      conditions.push(expr);
    } else { // key is field, {field: value}, {field: {op: value}}
      if (util.isPlainObject(where[key])) { // {field: {op: value}}
        const r = buildWhereSql(model, where[key], key, usedJoins);
        if (!r) continue;
        conditions.push(r);
      } else { // {field: value}, convert to {field: {$eq: value}}
        const tmp = {};
        tmp[key] = { $eq: where[key] };
        const r2 = buildWhereSql(model, tmp, null, usedJoins);
        if (!r2) continue;
        conditions.push(r2);
      }
    }
  }

  if (conditions.length === 1) return conditions[0];
  else if (conditions.length > 1) return `(${conditions.join(' and ')})`;
  else return null;
}

function getOrderBySql(model, sort, usedJoins) {
  const escapeId = model.frm.connection.escapeId;
  let orderby = '';
  if (sort && !util.isEmptyObject(sort)) {
    orderby = ' order by ';
    for (const fieldName in sort) {
      const field = model.def.fields[fieldName];
      if (field.props.join) {
        if (!usedJoins) throw new QueryError(model.name, 'not support join field %s in the sort of non-select statement', fieldName);
        usedJoins[field.props.join] = 1;
        orderby += `${model.def.joins[field.props.join].alias}.${escapeId(field.props.column)}`;
      } else if (usedJoins) orderby += `${model.def.alias}.${escapeId(field.props.column)}`;
      else orderby += escapeId(field.props.column);
      orderby += sort[fieldName].toUpperCase() === 'DESC' ? ' desc' : ' asc';
      orderby += ',';
    }
    orderby = orderby.substring(0, orderby.length - 1);
  }
  return orderby;
}

function getFromJoinSql(model, usedJoins) {
  const escapeId = model.frm.connection.escapeId;

  // from and join
  let fromAndJoin = ` from ${escapeId(model.def.table)} ${model.def.alias}`;

  // introduce the field used in join from join.on
  let joinName,
    join,
    cond,
    field;
  for (joinName in usedJoins) {
    join = model.def.joins[joinName];
    for (const ni in join.on) {
      cond = join.on[ni];
      if (cond.type !== 'field') continue;
      field = model.def.fields[cond.value];
      if (field.props.category !== 'join') continue;

      // joinName depends on field.join, or say field.join shoud lay before joinName in sql
      usedJoins[joinName] = field.props.join;
    }
  }

  // sort the used joins
  const tree = new Tree();
  for (joinName in usedJoins) {
    if (typeof usedJoins[joinName] === 'string') {
      tree.add(joinName, usedJoins[joinName]);
    } else tree.add(joinName);
  }
  const joins = tree.mlr();

  // generate join statement
  for (let ji = 0; ji < joins.length; ++ji) {
    joinName = joins[ji];
    join = model.def.joins[joinName];
    fromAndJoin += join.sql;
  }

  return fromAndJoin;
}

function getSelectSql(model, fieldNames, filter, sort, params) {
  const escapeId = model.frm.connection.escapeId;

  let offset = params.offset,
    count = params.limit;

  // the join names used in all places, like select fields/filter/sort.
  // then these join names will be exposed as join statements in the sql
  const usedJoins = {};

  if (params.joins) {
    let joins = params.joins;
    if (typeof joins === 'string') joins = joins.split(/\s*,\s*/);
    else if (joins instanceof Model) joins = [joins];
    else if (!Array.isArray(joins)) throw new QueryError(model.name, 'joins in find should be string or array');
    joins.forEach((join) => {
      if (!join) return;
      if (join instanceof Model) usedJoins[join.name] = 1;
      else if (typeof join === 'string') usedJoins[join] = 1;
      else throw new QueryError(model.name, 'joins element in find should be string or model');
    });
  }

  const fields = model.def.fields;

  let fieldList = '';
  for (const fi in fieldNames) {
    const fieldName = fieldNames[fi];
    const field = fields[fieldName];
    if (!field) throw new QueryError(model.name, 'error to generate select sql: not found field %s', fieldName);
    if (field.props.category !== 'entity' && field.props.category !== 'join') continue;
    if (field.props.join) {
      usedJoins[field.props.join] = 1;
      fieldList += model.def.joins[field.props.join].alias;
    } else {
      fieldList += model.def.alias;
    }
    fieldList += `.${escapeId(field.props.column)} ${escapeId(fieldName)},`;
  }
  fieldList = fieldList.substring(0, fieldList.length - 1);

  // where
  let where = buildWhereSql(model, filter, null, usedJoins);
  if (where) where = ` where ${where}`;
  else where = '';

  // order by
  const orderby = getOrderBySql(model, sort, usedJoins);

  // from & join
  const fromAndJoin = getFromJoinSql(model, usedJoins);

  // offset+count
  let limit = '';
  offset = Math.max(offset, 0), count = Math.max(count, 0);
  if (count > 0) {
    limit += ` limit ${count}`;
    if (offset > 0) limit += ` offset ${offset}`;
  }

  // assemble sql
  return `select ${fieldList}${fromAndJoin}${where}${orderby}${limit}`;
}

function getCountSql(model, filter) {
  const usedJoins = {};
  const escapeId = model.frm.connection.escapeId;

  // where
  let where = buildWhereSql(model, filter, null, usedJoins);
  if (where) where = ` where ${where}`;
  else where = '';

  // from & join
  const fromAndJoin = getFromJoinSql(model, usedJoins);

  // assemble SQL
  const countSql = `select count(*) ${escapeId('cnt')}${fromAndJoin}${where}`;

  return countSql;
}

// convert the field to table column
function cfv(model, set) {
  const cvs = {};// column values
  for (const fieldName in set) {
    const field = model.def.fields[fieldName];
    if (!field || field.props.category !== 'entity') continue;

    const value = set[fieldName];
    cvs[field.props.column] = value;
  }
  return cvs;
}

function getInsertSql(model, row) {
  if (Array.isArray(row)) {
    if (row.length > 1) return getBatchInsertSql(model, row);
    row = row[0];
  }

  let sql = `insert into ${model.frm.connection.escapeId(model.def.table)} set `;
  sql += model.frm.connection.escape(cfv(model, row));
  return sql;
}

function getBatchInsertSql(model, records) {
  const escapeId = model.frm.connection.escapeId,
    escape = model.frm.connection.escape;
  const table = escapeId(model.def.table);
  let fields = [],
    columns = [];
  records.forEach((record) => {
    const row = record._data;
    for (const fieldName in row) {
      if (fields.indexOf(fieldName) >= 0) continue;
      const field = model.def.fields[fieldName];
      if (!field || field.props.category !== 'entity') continue;

      const columnName = field.props.column;
      fields.push(fieldName);
      columns.push(escapeId(columnName));
    }
  });
  columns = columns.join(',');

  let sql = `insert into ${table}(${columns}) values`;
  const sqlValues = [];
  records.forEach((record) => {
    const row = record._data;
    let values = [];
    fields.forEach((fieldName, index) => {
      const value = escape(row[fieldName]);
      values.push(`${value}`);
    });
    values = values.join(',');
    sqlValues.push(`(${values})`);
  });
  sql += sqlValues.join(',');
  return sql;
}

function getUpdateSql(model, fvs, filter, sort, count) {
  const where = buildWhereSql(model, filter);

  let sql = `update ${model.frm.connection.escapeId(model.def.table)} set `;
  sql += model.frm.connection.escape(cfv(model, fvs));
  if (where) sql += ` where ${where}`;

  const orderby = getOrderBySql(model, sort);

  let limit = '';
  count = Math.max(count, 0);
  if (count > 0) {
    limit += ` limit ${count}`;
  }

  return sql + orderby + limit;
}

function getIncreaseSql(model, fvs, filter, sort, count) {
  const escapeId = model.frm.connection.escapeId;

  // set sql of the increment field
  let setSql = [];
  for (const fieldName in fvs) {
    const field = model.def.fields[fieldName];
    if (!field) continue;
    if (field.props.category !== 'entity') continue;

    const value = fvs[fieldName];

    const colName = escapeId(field.props.column);
    setSql.push(`${colName}=${colName}+${value}`);
  }
  setSql = setSql.join(',');

  const where = buildWhereSql(model, filter);

  const orderby = getOrderBySql(model, sort);

  let limit = '';
  count = Math.max(count, 0);
  if (count > 0) {
    limit += ` limit ${count}`;
  }

  // assemble SQL
  let sql = `update ${escapeId(model.def.table)} set `;
  sql += setSql;
  if (where) sql += ` where ${where}`;
  return sql + orderby + limit;
}

function getDeleteSql(model, filter, sort, count) {
  const where = buildWhereSql(model, filter);

  let sql = `delete from ${model.frm.connection.escapeId(model.def.table)}`;
  if (where) sql += ` where ${where}`;

  const orderby = getOrderBySql(model, sort);

  let limit = '';
  count = Math.max(count, 0);
  if (count > 0) {
    limit += ` limit ${count}`;
  }

  return sql + orderby + limit;
}

function getMaxSql(model, fieldName, filter) {
  const escapeId = model.frm.connection.escapeId;
  const usedJoins = {};

  // where
  const where = buildWhereSql(model, filter, null, usedJoins);

  // from & join
  const fromAndJoin = getFromJoinSql(model, usedJoins);

  // assemble SQL
  let sql = `select max(${escapeId(fieldName)}) ${escapeId('value')}`;
  sql += fromAndJoin;
  if (where) sql += ` where ${where}`;

  return sql;
}

module.exports = {
  activateField,
  normFilter,
  normSort,
  count: getCountSql,
  select: getSelectSql,
  delete: getDeleteSql,
  insert: getInsertSql,
  update: getUpdateSql,
  increase: getIncreaseSql,
  max: getMaxSql,
};
