/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');

describe('frm.types.Integer', function () {
  let frm;
  beforeEach(async function () {
    frm = common.mysql();
    assert.equal(await common.hasTable(frm, 'person'), false);
  });
  afterEach(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should save async correctly', async function () {
    const Person = frm.model('Person', { width: 'Integer' });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'width', 'int(11)'), true);

    await Person.create({ width: 10.1 }).save();
    assert.strictEqual((await Person.findOne()).width, 10);
  });

  it('should normalize the value when set/async get', async function () {
    const Person = frm.model('Person', { width: 'Integer' });
    await frm.ensure();

    const person = Person.create({ width: '1' });
    assert.strictEqual(person.width, 1);
    await person.save();
    assert.strictEqual((await Person.findOne()).width, 1);
  });

  it('should realize the value change async correctly', async function () {
    const Person = frm.model('Person', { width: 'Integer' });
    await frm.ensure();
    const person = await Person.create({ width: 1 }).save();
    person.width += 1.5;
    assert.strictEqual(person.width, 2);
    await person.save();
    assert.strictEqual((await Person.findOne()).width, 2);
  });

  it('should throw with overflowed value: length=async 1', async function () {
    const Person = frm.model('Person', { width: { type: 'Integer', length: 1 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'width', 'tinyint(4)'), true);

    const person = Person.create({ width: 127.51 });
    assert.strictEqual(person.width, 127);

    assert.throws(function () {
      person.width = 128;
    });

    person.width = -128;
    assert.strictEqual(person.width, -128);

    assert.throws(function () {
      person.width = -129;
    });
  });

  it('should throw with overflowed value: length=async 2', async function () {
    const Person = frm.model('Person', { width: { type: 'Integer', length: 2 } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'width', 'smallint(6)'), true);

    const person = Person.create({ width: 32767.51 });
    assert.strictEqual(person.width, 32767);

    assert.throws(function () {
      person.width = 32768;
    });

    person.width = -32768;
    assert.strictEqual(person.width, -32768);

    assert.throws(function () {
      person.width = -32769;
    });
  });

  it('should throw with overflowed value: length=async 4', async function () {
    const Person = frm.model('Person', { width: { type: 'Integer', length: 4 } });
    await frm.ensure();

    const person = Person.create({ width: 2147483647.51 });
    assert.strictEqual(person.width, 2147483647);

    assert.throws(function () {
      person.width = 2147483648;
    });

    person.width = -2147483648;
    assert.strictEqual(person.width, -2147483648);

    assert.throws(function () {
      person.width = -2147483649;
    });
  });

  describe('normalize different type', function () {
    let field;
    before(async function () {
      const Type = frm.model('Type', { width: 'Integer' });
      field = Type.def.fields.width;
    });
    it('should work with string', function () {
      assert.strictEqual(field.normalize('1'), 1);
      assert.strictEqual(field.normalize('-0'), 0);
      assert.strictEqual(field.normalize('0.01'), 0);
      assert.strictEqual(field.normalize('-0.01'), 0);
    });
    it('should work with number', function () {
      assert.strictEqual(field.normalize(1.1), 1);
      assert.strictEqual(field.normalize(1.5), 1);
      assert.strictEqual(field.normalize(-1.5), -1);
      assert.strictEqual(field.normalize(-1.1), -1);
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
      try {
        assert.strictEqual(field.normalize(now), now.getTime());
        throw 'should throw';
      } catch (e) {
        assert(e.message.indexOf('overflowed') > 0);
      }
    });
  });
});
