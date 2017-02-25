

const parseUrl = require('url').parse;
const Type = require('./type');
const Connection = require('./connection');
const FrmError = require('./error');
const Model = require('./model');

function Frm(url, options) {
  options = parseOptions(url, options);

  this.connection = Connection.create(options);
  this.models = {};
}
Object.defineProperty(Frm, 'types', { value: Type.types });

const proto = Frm.prototype;
Object.defineProperty(proto, 'types', { value: Type.types });

proto.set = function (paramName, value) {
};

// define a model or get it
proto.model = function (name, fieldProps, options) {
  if (arguments.length > 1) { // define a model
    if (this.models[name]) throw new FrmError('already defined model %s', name);
    const model = new Model(this, name, fieldProps, options);
    this.models[name] = model;
    return model;
  } else if (!this.models[name]) throw new FrmError('undefined model %s', name);
  return this.models[name];
};
proto.hasModel = function (name) {
  return !!this.models[name];
};

proto.ensure = function () {
  return Promise.all(Object.keys(this.models).map(name => this.connection.ensureModel(this.models[name])));
};
proto.query = function (sql) {
  return this.connection.query(sql);
};
proto.close = function () {
  this.connection.close();
};

function parseOptions(url, options) {
  options || (options = {});

  if (typeof url === 'string') {
    options = Object.assign(parseConnUrl(url), options);
  } else { // object
    options = url;
  }
  return options;
}

function parseConnUrl(url) {
  let options = {};

  const urlObj = parseUrl(url, true);
  if (urlObj.query) options = urlObj.query;

  if (urlObj.auth) {
    const parts = urlObj.auth.split(':');
    options.user = parts[0], options.password = parts[1];
  }
  options.host = urlObj.hostname;
  options.port = urlObj.port;
  options.database = urlObj.pathname.slice(1);
  options.protocol = urlObj.protocol.slice(0, -1);
  return options;
}

module.exports = exports = Frm;
