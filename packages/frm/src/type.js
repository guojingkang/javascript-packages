

module.exports = exports = FieldType;
exports.createField = createField;

const util = require('util');
const Model = require('./model');
const lutil = require('./util');
const FrmError = require('./error'),
  InvalidDefinitionError = FrmError.InvalidDefinitionError;

// common props: type/prevDefault/postDefault/get/set/join/ref/column/unique

function FieldType(model, fieldName, fieldProps) {
  this.model = model;
  this.name = fieldName;
  this.props = fieldProps;
}
const proto = FieldType.prototype;

function noNorm(value) {
  return value;
}

// normalize the value
proto.normalize = function (value, options) {
  options || (options = {});

  const norm = this._normalize || noNorm;
  if (options.query) {
    if (Array.isArray(value)) {
      return value.map(v => norm.call(this, v, options));
    }
  }
  return norm.call(this, value, options);
};

proto.compare = function (newValue, oldValue) {
  if (newValue === oldValue) return true;
  else return false;
};
proto.toSQL = function () {};
proto._toSQL = function (type) {
  if (this.props.category !== 'entity') return null;
  const column = this.model.frm.connection.escapeId(this.props.column);
  const nullPart = this.props.required ? 'NOT NULL' : 'DEFAULT NULL';
  return [column, type, nullPart].join(' ');
};
proto.toString = function () {
  return JSON.stringify(this.props);
};
proto.toJSON = function () {
  return this.props;
};
proto.inspect = function () {
  return util.inspect(this.props);
};

// field structure:
//  {<name>: <type>} or
//  {<name>: {type: ,column: ,prevDefault: ,postDefault: ,get: ,set: ,ref: ,join: ,
//    length: ,required: ,min: , max: ,enum: , validation: }}
//  enum: array or {open: true|false, values: []}
//  validation: [validator, message] or {validator: ,message: }
//
// ref structure:
//
function createField(def, fieldName, fieldProps) {
  if (!lutil.isValidName(fieldName)) throw new InvalidDefinitionError(def.name, 'invalid field name %s', fieldName);
  if (!fieldProps) throw new InvalidDefinitionError(def.name, 'incomplete field %s', fieldName);
  if (!lutil.isPlainObject(fieldProps)) {
    fieldProps = { column: lutil.dbName(fieldName), category: 'entity', type: fieldProps };
  } else {
    fieldProps = Object.assign({}, fieldProps);
    if (typeof fieldProps.deps === 'string') {
      fieldProps.deps = fieldProps.deps.trim().split(/\s*,\s*/);
    } else if (!fieldProps.deps) fieldProps.deps = [];

    // determine and check the field's category
    if (fieldProps.virtual) {
      // if(fieldProps.get && typeof fieldProps.get!=='function'){
      //   throw new InvalidDefinitionError(def.name, "get property of virtual field %s should be function", fieldName);
      // }
      // if(fieldProps.set && typeof fieldProps.set!=='function'){
      //   throw new InvalidDefinitionError(def.name, "set property of virtual field %s should be function", fieldName);
      // }
      fieldProps.category = 'virtual';
    } else if (fieldProps.ref) {
      if (!fieldProps.column) {
        throw new InvalidDefinitionError(def.name, 'column property of ref field %s required', fieldName);
      }
      if (!def.refs[fieldProps.ref]) {
        throw new InvalidDefinitionError(def.name, 'ref %s not found', fieldProps.ref);
      }
      fieldProps.category = 'ref';
    } else if (fieldProps.join) {
      if (!fieldProps.column) {
        throw new InvalidDefinitionError(def.name, 'column property of join field %s required', fieldName);
      }
      let join;
      if (fieldProps.join instanceof Model) {
        for (const jj in def.joins) {
          if (def.joins[jj].model === fieldProps.join) {
            join = def.joins[jj];
            fieldProps.join = jj;
            break;
          }
        }
        if (!join) throw new InvalidDefinitionError(def.name, 'join %s not found', fieldProps.join);
      } else {
        join = def.joins[fieldProps.join];
        if (!join) throw new InvalidDefinitionError(def.name, 'join %s not found', fieldProps.join);
      }

      fieldProps.deps = lutil.uniqueConcat(fieldProps.deps, join.deps);
      fieldProps.category = 'join';
    } else {
      if (!fieldProps.column) fieldProps.column = lutil.dbName(fieldName);
      fieldProps.category = 'entity';
    }
  }

  const TypeClass = getTypeClass(fieldProps.type);
  if (!TypeClass) throw new InvalidDefinitionError(def.name, 'unsupportted type %s of field %s', fieldProps.type, fieldName);
  fieldProps.type = TypeClass;
  return new TypeClass(def.model, fieldName, fieldProps);
}

const types = exports.types = {
  String: require('./type/string'),
  Number: require('./type/number'),
  Integer: require('./type/integer'),
  Boolean: require('./type/boolean'),
  Date: require('./type/date'),
  Buffer: require('./type/buffer'),
  Timestamp: require('./type/timestamp'),
  // Float:require('./type/float'),
};

// function isValidType(type){
//   if(type===String || type===Number || type===Boolean || type===Date || type===Buffer){
//     return true;
//   }
//   if(typeof type ==='string') return types[type];
//   for(var ii in types){
//     if(types[ii]===type) return true;
//   }
//   return false;
// }

function getTypeClass(type) {
  switch (type) {
    case String:
      return types.String;
    case Number:
      return types.Number;
    case Date:
      return types.Date;
    case Boolean:
      return types.Boolean;
    case Buffer:
      return types.Buffer;
  }

  if (typeof type === 'string') return types[type];

  for (const ii in types) {
    if (types[ii] === type) return types[ii];
  }
  return null;
}

