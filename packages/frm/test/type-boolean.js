/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('frm.types.Boolean', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', { active: Boolean });
    await frm.ensure();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });
  afterEach(async function () {
    await Person.remove({ filter: {} });
  });

  it('should save correctly', async function () {
    assert.equal(await common.hasColumn(frm, 'person', 'active', 'tinyint(1)'), true);

    await Person.create({ active: true }).save();
    assert.strictEqual((await Person.findOne()).active, true);
  });

  it('should normalize the value when set/get', async function () {
    const person = Person.create({ active: 'TRUE' });
    assert.strictEqual(person.active, true);
    await person.save();
    assert.strictEqual((await Person.findOne()).active, true);
  });

  it('should realize the value change correctly', async function () {
    const person = await Person.create({ active: true }).save();
    person.active = !person.active;
    assert.strictEqual(person.active, false);
    await person.save();
    assert.equal((await Person.findOne()).active, false);
  });

  describe('normalize different type', function () {
    let field;
    before(async function () {
      const Type = frm.model('Type', { active: Boolean });
      field = Type.def.fields.active;
    });
    it('should work with number', function () {
      assert.strictEqual(field.normalize(1), true);
      assert.strictEqual(field.normalize(-1), true);
      assert.strictEqual(field.normalize(0.01), true);
      assert.strictEqual(field.normalize(0), false);
    });
    it('should work with null/undefined', function () {
      assert.strictEqual(field.normalize(null), false);
      assert.strictEqual(field.normalize(undefined), false);
    });
    it('should work with string', function () {
      assert.strictEqual(field.normalize(''), false);
      assert.strictEqual(field.normalize('0'), false);
      assert.strictEqual(field.normalize('a'), true);
      assert.strictEqual(field.normalize('true'), true);
      assert.strictEqual(field.normalize('TRUE'), true);
      assert.strictEqual(field.normalize('false'), false);
      assert.strictEqual(field.normalize('FALSE'), false);
      assert.strictEqual(field.normalize('FALSe'), false);
      assert.strictEqual(field.normalize('*false*'), false);
    });
    it('should work with date', function () {
      const now = new Date();
      assert.strictEqual(field.normalize(now), true);
    });
  });
});
