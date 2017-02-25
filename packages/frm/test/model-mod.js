/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('model modification', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', { name: String, num: Number, int: 'Integer' });
    await frm.ensure();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });
  afterEach(async function () {
    await Person.remove({ filter: {} });
  });

  it('should create a record', async function () {
    assert.equal(await Person.count(), 0);

    const person = Person.create();
    assert(person.id.length >= 27 && person.id.length <= 32);
    assert.equal(person.isNew, true);
    assert.equal(person.name, null);

    person.name = 'Tian Jian';
    await person.save();
    assert.equal(person.isNew, false);
    assert.equal(person.name, 'Tian Jian');
    assert.equal(await Person.count(), 1);

    await person.remove();
    assert.equal(person.isNew, false);
    assert.equal(await Person.count(), 0);
  });
  it('should insert a record', async function () {
    assert.equal(await Person.count(), 0);

    await Person.insert({ name: 'Tian' });
    assert.equal(await Person.count(), 1);
  });
  it('should batch insert some records', async function () {
    assert.equal(await Person.count(), 0);

    let persons = await Person.insert([{ name: 'Tian' }, { name: 'Tian1', num: 1 }, { name: 'Tian2', int: 2 }]);
    assert.equal(persons.length, 3);
    assert(persons[0].id.length >= 27 && persons[0].id.length <= 32);
    assert(persons[1].id.length >= 27 && persons[1].id.length <= 32);
    assert(persons[2].id.length >= 27 && persons[2].id.length <= 32);
    assert.deepEqual(persons.toJSON(), [
      { name: 'Tian', num: null, int: null, id: persons[0].id },
      { name: 'Tian1', num: 1, int: null, id: persons[1].id },
      { name: 'Tian2', num: null, int: 2, id: persons[2].id }]);

    assert.equal(await Person.count(), 3);

    persons = (await Person.find()).toJSON();
    assert.deepEqual(persons, [
      { name: 'Tian', num: null, int: null, id: persons[0].id },
      { name: 'Tian1', num: 1, int: null, id: persons[1].id },
      { name: 'Tian2', num: null, int: 2, id: persons[2].id }]);
  });
  it('should update directly', async function () {
    assert.equal(await Person.count(), 0);
    await Person.create({ name: 'jian' }).save();
    assert.strictEqual((await Person.findOne()).name, 'jian');
    await Person.update({ set: { name: 'jian2' }, filter: { name: 'jian' } });
    assert.strictEqual((await Person.findOne()).name, 'jian2');
  });
  it('should remove directly', async function () {
    assert.equal(await Person.count(), 0);
    await Person.create({ name: 'jian' }).save();
    assert.strictEqual((await Person.findOne()).name, 'jian');
    await Person.remove({ filter: { name: 'jian' } });
    assert.equal(await Person.count(), 0);
  });
  it('should increase directly', async function () {
    assert.equal(await Person.count(), 0);
    await Person.create({ num: 1, int: 0 }).save();
    assert.strictEqual((await Person.findOne()).num, 1);
    await Person.increase({ set: { num: 2 }, filter: { num: 1 } });
    assert.strictEqual((await Person.findOne()).num, 3);
    await Person.increase({ set: { int: 1 }, filter: { int: 0 } });
    assert.strictEqual((await Person.findOne()).int, 1);
  });

  describe('limit and sort', function () {
    beforeEach(async function () {
      await Person.create({ name: '1', int: 1, num: 1 }).save();
      await Person.create({ name: '2', int: 2, num: 2 }).save();
      await Person.create({ name: '3', int: 3, num: 3 }).save();
    });
    afterEach(async function () {
      await Person.remove({ filter: {} });
    });
    it('should update top 2 rows only', async function () {
      await Person.update({ set: { name: 'a' }, filter: {}, limit: 2 });
      const persons = await Person.find();
      assert.equal(persons[0].name, 'a');
      assert.equal(persons[1].name, 'a');
      assert.equal(persons[2].name, '3');
    });
    it('should update top 2 rows only with sort', async function () {
      await Person.update({ set: { name: 'a' }, filter: {}, sort: '-name', limit: 2 });
      const persons = await Person.find();
      assert.equal(persons[0].name, '1');
      assert.equal(persons[1].name, 'a');
      assert.equal(persons[2].name, 'a');
    });
    it('should update top n rows only', async function () {
      await Person.update({ set: { name: 'a' }, filter: {}, limit: 10 });
      const persons = await Person.find();
      assert.equal(persons[0].name, 'a');
      assert.equal(persons[1].name, 'a');
      assert.equal(persons[2].name, 'a');
    });
    it('should increase top 2 rows only', async function () {
      await Person.increase({ set: { int: 1 }, filter: {}, limit: 2 });
      const persons = await Person.find();
      assert.equal(persons[0].int, 2);
      assert.equal(persons[1].int, 3);
      assert.equal(persons[2].int, 3);
    });
    it('should increase top 2 rows only with sort', async function () {
      await Person.increase({ set: { int: 1 }, filter: {}, sort: '-int', limit: 2 });
      const persons = await Person.find();
      assert.equal(persons[0].int, 1);
      assert.equal(persons[1].int, 3);
      assert.equal(persons[2].int, 4);
    });
    it('should remove top 2 rows only', async function () {
      await Person.remove({ filter: {}, limit: 2 });
      const persons = await Person.find();
      assert.equal(persons.length, 1);
      assert.equal(persons[0].name, '3');
    });
    it('should remove top 2 rows only with sort', async function () {
      await Person.remove({ filter: {}, limit: 2, sort: '-name' });
      const persons = await Person.find();
      assert.equal(persons.length, 1);
      assert.equal(persons[0].name, '1');
    });
  });
});
