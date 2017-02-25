/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();
let Person;

describe('builder operator', function () {
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', { name: { type: String, length: 1 }, bool: Boolean });
    await frm.ensure();
    await Person.create({ name: 'a', bool: true }).save();
    await Person.create({ name: 'b' }).save();
    await Person.create({ name: 'c', bool: true }).save();
    await Person.create({ name: 'd' }).save();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should filter with default equal operator', async function () {
    const persons = await find({ name: 'a' });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, 'a');
  });

  it.only('should filter with default equal operator for boolean field', async function () {
    const persons = await find({ bool: true });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'c');
  });

  it('should filter with default $in operator for array', async function () {
    const persons = await find({ name: ['a', 'b'] });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'b');
  });

  it('should filter with `like` operator', async function () {
    const persons = await find({ name: '*b*' });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, 'b');
  });

  it('should filter with $eq operator', async function () {
    const persons = await find({ name: { $eq: 'b' } });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, 'b');
  });

  it('should filter with $ne operator', async function () {
    const persons = await find({ name: { $ne: 'c' } });
    assert.equal(persons.length, 3);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'b');
    assert.equal(persons[2].name, 'd');
  });

  it('should filter with $gt operator', async function () {
    const persons = await find({ name: { $gt: 'c' } });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, 'd');
  });

  it('should filter with $ge operator', async function () {
    const persons = await find({ name: { $ge: 'c' } });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, 'c');
    assert.equal(persons[1].name, 'd');
  });

  it('should filter with $le operator', async function () {
    const persons = await find({ name: { $le: 'c' } });
    assert.equal(persons.length, 3);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'b');
    assert.equal(persons[2].name, 'c');
  });

  it('should filter with $lt operator', async function () {
    const persons = await find({ name: { $lt: 'c' } });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'b');
  });

  it('should filter with $and operator', async function () {
    const persons = await find({ $and: [{ name: 'a' }, { name: { $eq: 'a' } }] });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, 'a');
  });

  it('should filter with $or operator', async function () {
    const persons = await find({ $or: [{ name: 'a' }, { name: 'd' }] });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, 'a');
    assert.equal(persons[1].name, 'd');
  });
});

async function find(filter) {
  const Person = frm.model('Person');
  return await Person.find({ filter });
}
