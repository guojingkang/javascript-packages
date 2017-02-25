/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');

describe('frm.types.String', function () {
  let frm;
  beforeEach(async function () {
    frm = common.mysql();
    assert.equal(await common.hasTable(frm, 'person'), false);
  });
  afterEach(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should save correctly', async function () {
    const Person = frm.model('Person', { name: String });
    await frm.ensure();
    await Person.create({ name: 'a' }).save();
    assert.strictEqual((await Person.findOne()).name, 'a');
  });

  it('should normalize the value when set/get', async function () {
    const Person = frm.model('Person', { name: String });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(255)'), true);

    const person = Person.create({ name: 1 });
    assert.strictEqual(person.name, '1');
    await person.save();
    assert.strictEqual((await Person.findOne()).name, '1');
  });

  it('should realize the value change correctly', async function () {
    const Person = frm.model('Person', { name: String });
    await frm.ensure();
    const person = await Person.create({ name: 'a' }).save();
    person.name += 'b';
    assert.strictEqual(person.name, 'ab');
    await person.save();
    assert.strictEqual((await Person.findOne()).name, 'ab');
  });

  it('should trim the value', async function () {
    const Person = frm.model('Person', { name: { type: String } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(255)'), true);

    const person = await Person.create({ name: '\n \ta \t\nb\n \t' }).save();
    assert.strictEqual(person.name, 'a \t\nb');
    assert.strictEqual((await Person.findOne()).name, 'a \t\nb');
  });

  it('should escape with special char, like \',\\', async function () {
    const Person = frm.model('Person', { name: { type: String } });
    await frm.ensure();

    const person = await Person.create({ name: '\\\'' }).save();
    assert.strictEqual(person.name, '\\\'');
    assert.strictEqual((await Person.findOne()).name, '\\\'');
  });

  it('should throw when overflowed', async function () {
    const Person = frm.model('Person', { name: { type: String, length: 2 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(2)'), true);

    const person = Person.create({ name: 'ab' });
    assert.strictEqual(person.name, 'ab');
    assert.throws(function () {
      person.name = 'abc';
    });
  });

  it('should truncate the overflowed value with truncate=true', async function () {
    const Person = frm.model('Person', { name: { type: String, length: 2, truncate: true } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(2)'), true);

    const person = Person.create({ name: 'ab' });
    assert.strictEqual(person.name, 'ab');
    person.name = 'abc';
    assert.strictEqual(person.name, 'ab');
  });

  it('should work with big=true', async function () {
    const Person = frm.model('Person', { name: { type: String, big: true } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'text'), true);

    let bigstr = '';
    for (let ii = Math.pow(2, 16) - 1; ii > 0; --ii) bigstr += 'a';
    assert.equal(bigstr.length, 65535);

    await Person.create({ name: bigstr }).save();
    assert.strictEqual((await Person.findOne()).name, bigstr);
  });

  it('should work with length=65535', async function () {
    const Person = frm.model('Person', { name: { type: String, length: 65535 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'text'), true);
  });

  it('should work with non-bmp chars', async function () {
    const Person = frm.model('Person', { name: { type: String } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(255)'), true);

    const nonBmp = '😄';
    assert.equal(nonBmp.length, 2);
    await Person.create({ name: nonBmp }).save();
    assert.strictEqual((await Person.findOne()).name, nonBmp);
  });

  it('should ignore non-bmp chars with bmp=true', async function () {
    const Person = frm.model('Person', { name: { type: String, bmp: true } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'name', 'varchar(255)'), true);

    const nonBmp = '1😄2';
    await Person.create({ name: nonBmp }).save();
    assert.strictEqual((await Person.findOne()).name, '12');
  });

  describe('normalize different type', function () {
    let field;
    before(async function () {
      const Type = frm.model('Type', { name: String });
      field = Type.def.fields.name;
    });
    it('should work with number', function () {
      assert.strictEqual(field.normalize(1), '1');
      assert.strictEqual(field.normalize(0.01), '0.01');
    });
    it('should work with null/undefined', function () {
      assert.strictEqual(field.normalize(null), null);
      assert.strictEqual(field.normalize(undefined), null);
    });
    it('should work with boolean', function () {
      assert.strictEqual(field.normalize(false), 'false');
      assert.strictEqual(field.normalize(true), 'true');
    });
    it('should work with date', function () {
      const now = new Date();
      assert.strictEqual(field.normalize(now), now.toString());
    });
  });
});
