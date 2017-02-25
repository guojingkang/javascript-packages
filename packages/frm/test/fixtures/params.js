

const util = require('util');
const qs = require('querystring');

const mysqlParam = require('./mysql.json');
mysqlParam.protocol = 'mysql';
exports.mysql = {
  connOption: mysqlParam,
  connString: createConnString(mysqlParam),
};

function createConnString(params) {
  let url = util.format('%s://%s:%s@%s:%s/%s',
    params.protocol, params.user, params.password, params.host, params.port, params.database);

  const extraParams = {};
  for (const kk in params) {
    if (kk === 'protocol' || kk === 'user' || kk === 'password' || kk === 'host' ||
      kk === 'port' || kk === 'database') continue;
    extraParams[kk] = params[kk];
  }
  const sExtraParams = qs.stringify(extraParams);
  if (sExtraParams) url += `?${sExtraParams}`;
  return url;
}
