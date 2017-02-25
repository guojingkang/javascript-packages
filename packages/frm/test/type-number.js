/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');

describe('frm.types.Number', function () {
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
    const Person = frm.model('Person', { money: Number });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'money', 'decimal(15,0)'), true);

    await Person.create({ money: 10.1 }).save();
    assert.strictEqual((await Person.findOne()).money, 10);
  });

  it('should normalize the value when set/get', async function () {
    const Person = frm.model('Person', { money: Number });
    await frm.ensure();

    const person = Person.create({ money: '1' });
    assert.strictEqual(person.money, 1);
    await person.save();
    assert.strictEqual((await Person.findOne()).money, 1);
  });

  it('should realize the value change correctly', async function () {
    const Person = frm.model('Person', { money: Number });
    await frm.ensure();
    const person = await Person.create({ money: 1 }).save();
    person.money += 1;
    assert.strictEqual(person.money, 2);
    await person.save();
    assert.strictEqual((await Person.findOne()).money, 2);
  });

  it('should truncate the decimal part of overflowed value', async function () {
    const Person = frm.model('Person', { money: { type: Number, precision: 3, scale: 2 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'money', 'decimal(3,2)'), true);

    const person = Person.create({ money: 3.11 });
    assert.strictEqual(person.money, 3.11);

    person.money = 3.111;
    assert.strictEqual(person.money, 3.11);

    person.money = 3.115;
    assert.strictEqual(person.money, 3.12);

    person.money = -0.111;
    assert.strictEqual(person.money, -0.11);

    person.money = -0.115;
    assert.strictEqual(person.money, -0.12);
  });

  it('should throw with integer part overflowed', async function () {
    const Person = frm.model('Person', { money: { type: Number, precision: 3, scale: 1 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'money', 'decimal(3,1)'), true);

    const person = Person.create({ money: 99.51 });
    assert.strictEqual(person.money, 99.5);

    assert.throws(function () {
      person.money = 101;
    });

    person.money = -11;
    assert.strictEqual(person.money, -11);

    assert.throws(function () {
      person.money = -121;
    });
  });

  it('should truncate the overflowed integer part with truncate=true', async function () {
    const Person = frm.model('Person', { money: { type: Number, precision: 3, scale: 1, truncate: true } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'money', 'decimal(3,1)'), true);

    const person = Person.create({ money: 99.51 });
    assert.strictEqual(person.money, 99.5);

    person.money = 101;
    assert.strictEqual(person.money, 1);

    person.money = -11;
    assert.strictEqual(person.money, -11);

    person.money = -121;
    assert.strictEqual(person.money, -21);

    person.money = -121.15;
    assert.strictEqual(person.money, -21.2);
  });

  describe('normalize different type', function () {
    let field;
    before(function () {
      const Type = frm.model('Type', { money: Number });
      field = Type.def.fields.money;
    });
    it('should work with string', function () {
      assert.strictEqual(field.normalize('1'), 1);
      assert.strictEqual(field.normalize('-0'), 0);
      assert.strictEqual(field.normalize('0.01'), 0.01);
      assert.strictEqual(field.normalize('-0.01'), -0.01);
    });
    it('should work with null/undefined', function () {
      assert.strictEqual(field.normalize(null), null);
      assert.strictEqual(field.normalize(undefined), null);
    });
    it('should work with boolean', function () {
      assert.strictEqual(field.normalize(false), null);
      assert.strictEqual(field.normalize(true), null);
    });
    it('should work with date', function () {
      const now = new Date();
      assert.strictEqual(field.normalize(now), now.getTime());
    });
  });
});
