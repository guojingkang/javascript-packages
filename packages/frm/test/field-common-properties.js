/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('field common props', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', {
      strNoPrevDef: String,
      strPrevDef: { type: String, prevDefault: 'a' },
      intNoPrevDef: 'Integer',
      intPrevDef: { type: 'Integer', prevDefault: 0 },
      virtGetString: { type: String, virtual: true, prevDefault: 'a' },
      virtGetBool: { type: Boolean, virtual: true },
    });
    await frm.ensure();
  });
  afterEach(async function () {
    Person.remove({ filter: {} });
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should do with prevDefault prop', async function () {
    const p = Person.create();
    assert.equal(p.strNoPrevDef, null);
    assert.equal(p.strPrevDef, 'a');
    assert.equal(p.intNoPrevDef, null);
    assert.equal(p.intPrevDef, 0);
  });

  it('should do with get prop', async function () {
    let p = Person.create();
    assert.equal(p.virtGetString, undefined);// prevDefault not working with virtual
    assert.equal(p.virtGetBool, undefined);

    p.virtGetString = undefined;
    assert.equal(p.virtGetString, null);
    p.virtGetString = 'b';
    assert.equal(p.virtGetString, 'b');
    p.virtGetBool = 2;
    assert.equal(p.virtGetBool, true);
    p.virtGetString = 1;
    assert.equal(p.virtGetString, '1');

    await p.save();
    assert.equal(p.virtGetString, '1');
    assert.equal(p.virtGetBool, true);

    p = await Person.findOne({ filter: { id: p.id } });
    assert.equal(p.virtGetString, undefined);// query not working with virtual
    assert.equal(p.virtGetBool, undefined);

    p = await Person.findOne({ fields: 'virtGetString,virtGetBool,id', filter: { id: p.id } });
    assert.equal(p.virtGetString, undefined);// query not working with virtual
    assert.equal(p.virtGetBool, undefined);
  });

  it('should work with required prop');
  it('should work with validation prop');
  it('should work with enums prop');
});
