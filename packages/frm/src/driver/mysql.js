

const mysql = require('mysql');
const util = require('../util');
const Connection = require('../connection');
const debug = require('debug')('frm');

function MysqlConnection(options) {
  Connection.apply(this, arguments);

  this._db = mysql.createPool(options);
  this._query = util.a2p(this._db.query, this._db);
}
util.inherits(MysqlConnection, Connection);
const proto = MysqlConnection.prototype;

proto.escape = mysql.escape.bind(mysql);// escape the column's value
proto.escapeId = mysql.escapeId.bind(mysql);// escape the column

proto.query = function (sql) {
  const now = Date.now();
  return this._query(sql).then((result) => {
    debug('%s; %s ms', sql, Date.now() - now);
    return result;
  }).catch((e) => {
    debug('%s; %s ms', sql, Date.now() - now);
    throw e;
  });
};

proto.close = function () {
  return util.a2p(this._db.end, this._db)();
};

module.exports = exports = MysqlConnection;
