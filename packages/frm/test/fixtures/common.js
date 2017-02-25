

const testParams = require('./params');
const Frm = require('../..');

exports.hasTable = function hasTable(frm, table) {
  return frm.connection.query(`show tables like '${table}'`).then(result => result.length > 0);
};

exports.hasColumn = function hasColumn(frm, table, column, type) {
  return frm.connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}';`).then((result) => {
    if (result.length <= 0) return false;
    if (!type) return true;
    return result[0].Type.toLowerCase() === type.toLowerCase();
  });
};

exports.dropTable = function dropTable(frm, table) {
  return frm.connection.query(`drop table IF EXISTS \`${table}\``);
};

exports.mysql = function (options) {
  return new Frm(Object.assign({}, testParams.mysql.connOption, options));
};
