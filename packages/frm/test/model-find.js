/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('model find/count', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    frm.model('Person', { name: String, value: 'Integer', inactive: Boolean });
    await frm.ensure();

    Person = frm.model('Person');
    await Person.create({ name: 1, value: 1, inactive: true }).save();
    await Person.create({ name: 2, value: 2 }).save();
    await Person.create({ name: 3, value: 3, inactive: true }).save();
    await Person.create({ name: 4, value: 4 }).save();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should count all', async function () {
    const count = await Person.count();
    assert.equal(typeof count, 'number');
    assert.strictEqual(count, 4);
  });

  it('should work in exists', async function () {
    assert(await Person.exists({ name: 1 }));
    assert(!(await Person.exists({ name: 5 })));
  });

  it('should work in find', async function () {
    const persons = await Person.find();
    assert.equal(persons.length, 4);
    assert.strictEqual(persons[0].name, '1');
    assert.strictEqual(persons[1].name, '2');
    assert.strictEqual(persons[2].name, '3');
    assert.strictEqual(persons[3].name, '4');
  });
  it('should find only one', async function () {
    const person = await Person.findOne();
    assert(!!person);
    assert.strictEqual(person.name, '1');
  });
  it('should find by id', async function () {
    const persons = await Person.find();
    const person = await Person.findById({ id: persons[2].id });
    assert(!!person);
    assert.strictEqual(person.name, persons[2].name);
  });

  describe('field list', function () {
    it('should return all fields with `true`', async function () {
      const person = await Person.findOne();
      assert(!!person);
      assert.strictEqual(person.name, '1');
      assert.strictEqual(person.value, 1);
      assert.strictEqual(person.inactive, true);
    });

    it('should return selected fields with string argument', async function () {
      const person = await Person.findOne({ fields: 'name,value' });
      assert(!!person);
      assert.strictEqual(person.name, '1');
      assert.strictEqual(person.value, 1);
      assert.strictEqual(person.inactive, undefined);
    });

    it('should return selected fields with array argument', async function () {
      const person = await Person.findOne({ fields: ['name'] });
      assert(!!person);
      assert.strictEqual(person.name, '1');
      assert.strictEqual(person.value, undefined);
      assert.strictEqual(person.inactive, undefined);
    });
    it('should work with extra space', async function () {
      const person = await Person.findOne({ fields: 'name, value\n' });
      assert(!!person);
      assert.strictEqual(person.name, '1');
      assert.strictEqual(person.value, 1);
      assert.strictEqual(person.inactive, undefined);
    });
    it('should work with extra comma', async function () {
      const person = await Person.findOne({ fields: 'name,\nvalue,' });
      assert(!!person);
      assert.strictEqual(person.name, '1');
      assert.strictEqual(person.value, 1);
      assert.strictEqual(person.inactive, undefined);
    });
  });

  describe('sort', function () {
    it('should sort desc by string style(-name)', async function () {
      const persons = await Person.find({ sort: '-name' });
      assert.equal(persons.length, 4);
      assert.strictEqual(persons[3].name, '1');
      assert.strictEqual(persons[2].name, '2');
      assert.strictEqual(persons[1].name, '3');
      assert.strictEqual(persons[0].name, '4');
    });
    it('should sort by json style({name: "desc"})');
  });

  describe('limit', function () {
    it('should find with offset+count', async function () {
      const persons = await Person.find({ offset: 1, limit: 1 });
      assert.equal(persons.length, 1);
      assert.strictEqual(persons[0].name, '2');
    });
    it('should find all with offset only', async function () {
      const persons = await Person.find({ offset: 1 });
      assert.equal(persons.length, 4);
      assert.strictEqual(persons[0].name, '1');
    });
    it('should find with count only', async function () {
      const persons = await Person.find({ limit: 2 });
      assert.equal(persons.length, 2);
      assert.strictEqual(persons[0].name, '1');
      assert.strictEqual(persons[1].name, '2');
    });
  });

  describe('findAll', function () {
    it('should work with pageSize', async function () {
      let persons = [];
      await Person.findAll({ pageSize: 1 }, (rs) => {
        assert.equal(rs.length, persons.length === 4 ? 0 : 1);
        persons = [...persons, ...rs.toJSON()];
      });
      assert.equal(persons.length, 4);
      assert.strictEqual(persons[0].name, '1');
      assert.strictEqual(persons[1].name, '2');
      assert.strictEqual(persons[2].name, '3');
      assert.strictEqual(persons[3].name, '4');
    });
    it('should work with limit', async function () {
      let persons = [];
      await Person.findAll({ pageSize: 1, limit: 3 }, (rs) => {
        assert.equal(rs.length, 1);
        persons = [...persons, ...rs.toJSON()];
      });
      assert.equal(persons.length, 3);
      assert.strictEqual(persons[0].name, '1');
      assert.strictEqual(persons[1].name, '2');
      assert.strictEqual(persons[2].name, '3');
    });
  });

  // describe('invalid arguments', function(){
  //   it('should throw with invalid fields argument in find', async function(){
  //     assert.throws(async function(){
  //       await Person.find(null);
  //     }, function(err){
  //       assert.equal(err.message, 'error to query on model Person: fields required in find');
  //       return true;
  //     });
  //     assert.throws(async function(){
  //       await Person.find([]);
  //     }, function(err){
  //       assert.equal(err.message, 'error to query on model Person: fields required in find');
  //       return true;
  //     });
  //   });
  // });
});
