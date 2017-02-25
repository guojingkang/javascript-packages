

const Type = require('./type');
const util = require('./util');
const Model = require('./model');
const FrmError = require('./error'),
  InvalidDefinitionError = FrmError.InvalidDefinitionError;

function Definition(model, fields, options) {
  const name = model.name;
  if (!util.isValidName(name)) throw new InvalidDefinitionError(name, 'invalid model name');

  this.frm = model.frm;
  this.model = model;
  this.name = name;
  this.table = util.dbName(name);
  this.fields = {};
  this.joins = {};
  this.refs = {};
  this.indexes = [];

  // used in join
  this.alias = 't';
  this._joinCount = 0;// used in join alias name

  this.add('field', { id: { type: String, length: 32, required: true } });
  this.add('field', fields);

  options || (options = {});

  // parsed indexes
  if (options.indexes) {
    let indexes = options.indexes;
    if (!Array.isArray(indexes)) {
      indexes = Object.keys(indexes).map((name) => {
        const index = indexes[name];
        index.name = name;
        return index;
      });
    }

    indexes.forEach((index) => {
      if (!index.fields || index.fields.length <= 0) {
        throw new InvalidDefinitionError(this.name, 'fields required in index definition');
      }
      const fields = index.fields;
      const columns = fields.map((fieldName) => {
        const field = this.fields[fieldName];
        if (!field) {
          throw new InvalidDefinitionError(this.name, 'field %s not exist in index definition', fieldName);
        }
        if (field.props.category !== 'entity') {
          throw new InvalidDefinitionError(this.name, 'field %s not exist in index definition', fieldName);
        }
        return field.props.column;
      });

      if (index.unique && !index.message) {
        index.message = `${fields.join(',')} are unique`;
      }

      if (!index.name) {
        index.name = `${this.table}_${columns.join('_')}`;
      } else {
        index.name = `${this.table}_${index.name}`;
      }

      this.indexes.push(index);
    });
  }
}
const proto = Definition.prototype;

proto.add = function (type, values) {
  if (type === 'field') return addField.call(this, values);
  if (type === 'join') return addJoins.call(this, values);
  if (type === 'ref') return addRefs.call(this, values);
};

const reservedFieldNames = 'model,isNew,save,remove,copy,toString,toJSON,inspect,constructor,fields,set,get'.split(',');
// fields: {name: props}
function addField(fields) {
  for (const fieldName in fields) {
    if (reservedFieldNames.indexOf(fieldName) >= 0) {
      throw new InvalidDefinitionError(this.name, 'field %s is reserved name', fieldName);
    }
    const field = Type.createField(this, fieldName, fields[fieldName]);
    if (field.props.unique && field.props.category === 'entity') {
      let unique = field.props.unique,
        message = `${fieldName} is unique`;
      if (typeof unique === 'string') message = unique;
      const index = {
        name: `${this.table}_${field.props.column}`,
        fields: [fieldName], unique: true, message,
      };
      this.indexes.push(index);
    }

    this.fields[fieldName] = field;
  }
}

function addJoins(values) {
  values = Array.isArray(values) ? values : [values];
  values.forEach(value => addJoin.call(this, value));
}

function addJoin(params) {
  let name,
    model,
    on,
    left = true;
  if (params instanceof Model) {
    model = params, name = model.name;
  } else if (typeof params === 'string') {
    name = params, model = this.frm.model(name);
  } else if (!params || typeof params !== 'object') {
    throw new InvalidDefinitionError(this.name, 'invalid params to add join');
  } else {
    name = params.name, model = params.model, on = params.on, left = params.hasOwnProperty('left') ? (!!params.left) : true;
    if (!name) name = model.name;
  }
  if (this.joins[name]) throw new InvalidDefinitionError(this.name, 'join %s already defined', name);

  if (!on) {
    const valueFieldName = `${util.modelName2fieldName(name)}Id`;
    on = [{ column: 'id', type: 'field', value: valueFieldName }];
  }

  // TODO check the 'on' expression
  if (typeof on === 'string') {

  }

  const deps = [];// join dependency fields
  on.forEach((cond) => {
    let exists;
    for (const fieldName in model.def.fields) {
      const field = model.def.fields[fieldName];
      if (field.props.category === 'entity' && field.props.column === cond.column) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      throw new InvalidDefinitionError(this.name, 'nonexistent column %s in the join model %s', cond.field, name);
    }
    if (cond.type === 'field') {
      const value = this.fields[cond.value];
      if (!value) {
        throw new InvalidDefinitionError(this.name, 'nonexistent field %s in condition value of join %s', cond.value, name);
      }
      if (value.props.category !== 'entity' && value.props.category !== 'join') {
        throw new InvalidDefinitionError(this.name, 'field %s is not entity/join feild in condition value of join %s', cond.value, name);
      }
      deps.push(cond.value);
    }
  });

  // generate join part sql: join a on a.xxx=t.xxx
  const alias = name.slice(0, 1).toLowerCase() + this._joinCount;// join table alias
  let sql = '',
    escapeId = this.frm.connection.escapeId,
    escapeVal = this.frm.connection.escape;
  sql += left ? ' left join ' : ' join ';
  sql += `${escapeId(model.def.table)} ${alias} on `;

  // concat the condition sql
  on.forEach((cond, index) => {
    if (index > 0) {
      sql += ' and ';
    }

    sql += `${alias}.${escapeId(cond.column)}=`;
    if (cond.type === 'field') {
      const value = this.fields[cond.value];
      if (value.props.category === 'join') {
        sql += this.joins[value.props.join].alias;
      } else {
        sql += this.alias;
      }
      sql += `.${escapeId(value.props.column)}`;
    } else {
      sql += escapeVal(cond.value);
    }
  });

  this.joins[name] = { name, alias, model, on, left,
    deps, sql };
  ++this._joinCount;
  return this;
}

function addRefs(values) {
  values = Array.isArray(values) ? values : [values];
  values.forEach(value => addRef.call(this, value));
}

function addRef(params) {
  let name,
    model,
    on;
  if (params instanceof Model) {
    model = params, name = model.name;
  } else if (typeof params === 'string') {
    name = params, model = this.frm.model(name);
  } else if (!params || typeof params !== 'object') {
    throw new InvalidDefinitionError(this.name, 'invalid params to add ref');
  } else {
    name = params.name, model = params.model, on = params.on;
  }
  if (this.refs[name]) throw new InvalidDefinitionError(this.name, 'ref %s already defined', name);

  if (!on) {
    const valueFieldName = `${util.modelName2fieldName(name)}Id`;
    on = [{ type: 'field', field: 'id', value: valueFieldName }];
  }

  // TODO check the 'on' expression
  if (typeof on === 'string') {

  }

  const deps = [];
  on.forEach((cond) => {
    if (!model.def.fields[cond.field]) {
      throw new InvalidDefinitionError(this.name, 'nonexistent field %s in the ref model %s', cond.field, name);
    }
    if (cond.type === 'field') {
      if (!this.fields[cond.value]) {
        throw new InvalidDefinitionError(this.name, 'nonexistent field %s in condition value of ref %s', cond.value, name);
      }
      deps.push(cond.value);
    }
  });

  this.refs[name] = { name, model, on, deps };
  return this;
}

module.exports = exports = Definition;

