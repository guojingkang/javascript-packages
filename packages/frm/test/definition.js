/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('def', function () {
  it('should create a normal def model', function () {
    const Test = frm.model('Test', {
      name: String, dt: Date, bool: Boolean, num: Number, int: 'Integer', buff: Buffer,
    });
    assert(!!Test);
    assert.equal(Object.keys(Test.def.fields).length, 7);
    assert(Test.def.fields.name instanceof frm.types.String);
    assert(Test.def.fields.dt instanceof frm.types.Date);
    assert(Test.def.fields.bool instanceof frm.types.Boolean);
    assert(Test.def.fields.num instanceof frm.types.Number);
    assert(Test.def.fields.int instanceof frm.types.Integer);
    assert(Test.def.fields.buff instanceof frm.types.Buffer);
  });
  it('should reallocate props object', function () {
    const fields = {
      name: { type: String },
    };
    const Test = frm.model('Test2', fields);
    assert.equal(Test.def.fields.name.props.anything, undefined);
    fields.name.anything = true;
    assert.equal(Test.def.fields.name.props.anything, undefined);
  });
});
