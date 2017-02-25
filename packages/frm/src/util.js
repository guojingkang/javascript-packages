

module.exports = exports = require('util');
const util = exports;

const cuid = require('cuid');
exports.uid = function (modelName, recordData) {
  const id = cuid().slice(1);// 24 chars

  const modelId = modelName[0].toLowerCase() + Number(modelName.length).toString(36)[0];// 2 chars

  let recordLen = 0;
  for (const key in recordData) {
    recordLen += key.length;

    const value = recordData[key];
    const type = typeof value;
    if (type === 'string') recordLen += value.length;
    if (type === 'number') recordLen += value;
  }
  recordLen = Math.round(recordLen) % 2176782336;//= 36^6
  const dataId = Number(recordLen).toString(36).slice(0, 6);// max 6 chars

  return modelId + dataId + id;
};

// async callback to promise return
exports.a2p = function (fn, _this) {
  return function () {
    const args = Array.prototype.map.call(arguments, arg => arg);
    return new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) return reject(err);
        else return resolve(data);
      });
      fn.apply(_this, args);
    });
  };
};

exports.isPlainObject = function (obj) {
  return obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
};

const hasOwnProperty = Object.prototype.hasOwnProperty;
exports.isEmptyObject = function (obj) {
  if (!obj) return true;
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
};

exports.uniqueConcat = function (arr1, arr2) {
  const result = [];
  const len = arguments.length;
  for (let ii = 0; ii < len; ++ii) {
    const source = arguments[ii];
    for (let jj = source.length - 1; jj >= 0; --jj) {
      const item = source[jj];
      if (result.indexOf(item) < 0) result.push(item);
    }
  }
  return result;
};

const zeros = '000000000';
function pad(str, size) {
  return zeros.slice(0, size - (`${str}`).length) + str;
}
exports.formatDate = function (dt, pattern) {
  if (pattern === 'date') {
    return `${dt.getFullYear()}/${pad(dt.getMonth() + 1, 2)}/${pad(dt.getDate(), 2)}`;
  } else if (pattern === 'time') {
    return `${pad(dt.getHours(), 2)}:${pad(dt.getMinutes(), 2)}:${pad(dt.getSeconds(), 2)}`;
  } else {
    return `${dt.getFullYear()}/${pad(dt.getMonth() + 1, 2)}/${pad(dt.getDate(), 2)
      } ${pad(dt.getHours(), 2)}:${pad(dt.getMinutes(), 2)}:${pad(dt.getSeconds(), 2)}`;
  }
};

const reDateTime = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
const reDate = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
const reTime = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
exports.parseDate = function (str) {
  let match = reDateTime.exec(str);
  if (match) {
    const dt = new Date();
    dt.setFullYear(match[1], match[2] - 1, match[3]);
    dt.setHours(match[4], match[5], match[6], 0);
    return dt;
  }

  match = reDate.exec(str);
  if (match) {
    const d = new Date();
    d.setFullYear(match[1], match[2] - 1, match[3]);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  match = reTime.exec(str);
  if (match) {
    const t = new Date();
    t.setHours(match[1], match[2], match[3], 0);
    return t;
  }
  return null;
};

// check the model name/field name. not allow the underline(_)
const reValidName = /^[a-zA-Z]([a-zA-Z0-9])*$/;
exports.isValidName = function (str) {
  return reValidName.test(str);
};

// convert the string to a underline-delimited string which will used in database
exports.dbName = function (str) {
  if (!str) return str;
  str = str.replace(/[A-Z]/g, $0 => `_${$0.toLowerCase()}`);
  if (str[0] === '_') return str.slice(1);
  return str;
};

// make the first char of string to lowercase
exports.modelName2fieldName = function (str) {
  str = str[0].toLowerCase() + str.slice(1);
  return str;
};

exports.checkBeforeSave = function (r) {
  const Type = require('./type');
  const model = r.model,
    fields = model.def.fields;

  const savedFieldNames = util.uniqueConcat(Object.keys(r._data), Object.keys(r._changed));
  savedFieldNames.map((fieldName) => {
    const field = fields[fieldName];
    if (field.props.category !== 'entity') return;

    let value = r[fieldName];

    // calculate the postDefault
    if (!value && value !== 0 && field.postDefault) {
      const postDefault = field.postDefault;
      if (typeof postDefault === 'function') {
        value = postDefault();
      } else {
        value = postDefault;
      }

      r[fieldName] = value;
    }

    // required check
    if (field.type !== Type.types.Boolean && !value && value !== 0 && field.required) {
      throw new ValidationError(model.name, 'field %s required', fieldName);
    }

    // validation check
    // if(field.validation){
    // }
  });
};

exports.parseError = function (model, e) {
  if (!e) return;
  if (e.code === 'ER_DUP_ENTRY') {
    let message = e.message;
    const match = /for key '(\w+)'/.exec(e.message);
    const indexName = match && match[1];
    if (indexName) {
      model.def.indexes.forEach((index) => {
        if (index.name === indexName) {
          message = index.message;
        }
      });
    }
    const err = new Error(message);
    err.statusCode = 409;
    return Promise.reject(err);
  }
  return Promise.reject(e);
};
