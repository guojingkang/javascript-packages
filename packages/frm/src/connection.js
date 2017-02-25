

module.exports = exports = Connection;

const EventEmitter = require('events').EventEmitter;
const util = require('util');
const FrmError = require('./error');
const debug = require('debug')('frm');

function Connection(frm, options) {
  EventEmitter.call(this);
  this.frm = frm;
}
util.inherits(Connection, EventEmitter);

const drivers = {
  mysql: require('./driver/mysql'),
};
Connection.create = function (options) { // factory method
  const ConnClass = drivers[options.protocol];
  if (!ConnClass) {
    throw new FrmError('unsupportted connection protocol: ', options.protocol);
  }

  return new ConnClass(options);
};

const proto = Connection.prototype;

// these methods should be implemented in sub class
proto.close = function () {};// close the connection
proto.query = function (sql) {};// exec the sql, include ddl and dml
proto.escape = function (val) {};// escape the column's value
proto.escapeId = function (name) {};// escape the column name

proto.ensureModel = function (model) {
  const table = model.def.table;
  return this.hasTable(table).then((y) => {
    if (y) {
      debug('table of model %s is existent, pass to ensure', model.name);
    } else {
      const fields = model.def.fields;
      const columns = Object.keys(fields).reduce((result, fieldName) => {
        let field = fields[fieldName],
          sql = field.toSQL();
        if (sql) result.push(sql);
        return result;
      }, []);

      let sql = 'CREATE TABLE %s (\n  %s,\n  PRIMARY KEY (`id`)\n);';
      sql = util.format(sql, table, columns.join(',\n  '));
      return this.query(sql).then(() => debug('table of model %s is created', model.name));
    }
  }).then(() => {
    const indexes = model.def.indexes;
    if (!indexes || indexes.length <= 0) return;
    return this.queryIndex(table).then((dbIndexes) => {
      const nonexists = indexes.filter(index => dbIndexes.findIndex(dbIndex => index.name === dbIndex.name) < 0);
      const fields = model.def.fields;
      return Promise.all(nonexists.map((index) => {
        const columns = index.fields.map(fieldName => fields[fieldName].props.column);

        return this.createIndex({ table, unique: index.unique, columns, name: index.name })
        .then(() => debug('table index %s of model %s is created', index.name, model.name));
      }));
    });
  }).catch((e) => {
    console.error(`failed to ensure model ${model.name}: ${e.stack || e.toString()}`);
  });
};

proto.hasTable = function (table) {
  return this.query(`show tables like '${table}'`).then(result => result.length > 0);
};

proto.hasColumn = function hasColumn(table, column, type) {
  return this.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`).then((result) => {
    if (result.length <= 0) return false;
    if (!type) return true;
    return result[0].Type.toLowerCase() === type.toLowerCase();
  });
};

proto.dropTable = function (table) {
  return this.query(`drop table IF EXISTS \`${table}\``);
};

proto.hasIndex = function (table, index) {
  return this.hasTable(table).then((y) => {
    if (!y) return false;

    const sql = util.format('show index from %s where key_name=%s', this.escapeId(table), this.escape(index));
    return this.query(sql).then(result => result.length > 0);
  });
};

proto.queryIndex = function (table, indexName) {
  let sql;
  if (!indexName) sql = util.format('show index from %s', this.escapeId(table));
  else sql = util.format('show index from %s where key_name=%s', this.escapeId(table), this.escape(indexName));
  return this.query(sql).then(result => result.map((index) => {
    const record = {};
    for (let kk in index) {
      const vv = index[kk];
      kk = kk.toLowerCase();
      record[kk] = vv;
    }
    return { name: record.key_name, column: record.column_name, unique: !record.non_unique, table };
  })).then((result) => {
    const merged = {};
    result.forEach((row) => {
      const name = row.name;
      if (merged[name]) {
        merged[name].columns.push(row.column);
      } else {
        merged[name] = { name, table: row.table, unique: row.unique, columns: [row.column] };
      }
    });
    return Object.keys(merged).map(key => merged[key]);
  }).then((result) => {
    if (indexName) return result[0];
    return result;
  });
};

proto.createIndex = function (index) {
  let table = index.table,
    name = index.name,
    columns = index.columns,
    unique = index.unique;
  const sql = util.format('create %s index %s on %s(%s)',
    unique ? 'unique' : '', this.escapeId(name), this.escapeId(table), this.escapeId(columns));
  return this.query(sql);
};

proto.dropIndex = function (table, index) {
  const sql = util.format('drop index %s on %s', this.escapeId(index), this.escapeId(table));
  return this.query(sql);
};
