/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('record', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    frm.model('Person', { name: String, num: Number });
    await frm.ensure();
    Person = frm.model('Person');
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });
  afterEach(async function () {
    await Person.remove({ filter: {} });
  });

  it('should construct record from find', async function () {
    await Person.create({ name: 'a' }).save();
    const persons = await Person.find();
    assert.equal(persons.length, 1);
    const person = persons[0];

    const personJson = `{"id":"${person.id}","name":"a","num":null}`;
    assert.equal(JSON.stringify(persons), `[${personJson}]`);
    assert.equal(person.isNew, false);
    assert.equal(JSON.stringify(person), personJson);
  });

  it('should construct record from create', async function () {
    const person = Person.create({ name: 'a' });
    assert.equal(person.isNew, true);

    const personJson = `{"name":"a","id":"${person.id}","num":null}`;
    assert.equal(JSON.stringify(person), personJson);
  });

  it('should save', async function () {
    const person = await Person.create({ name: 'a' }).save();
    assert.equal(person.isNew, false);

    const personJson = `{"name":"a","id":"${person.id}","num":null}`;
    assert.equal(JSON.stringify(person), personJson);
  });

  it('should save the unselecte field', async function () {
    await Person.create({ name: 'a', num: 1 }).save();
    const person = await Person.findOne({ fields: 'id,name' });
    assert.equal(person.num, null);
    person.num = 2;
    await person.save();
    assert.equal(person.num, 2);

    assert.equal((await Person.findOne({ fields: 'num' })).num, 2);
  });

  it('should remove', async function () {
    assert.equal(await Person.count(), 0);

    const person = await Person.create({ name: 'a' }).save();
    assert.equal(person.isNew, false);
    assert.equal(await Person.count(), 1);

    await person.remove();
    assert.equal(await Person.count(), 0);
  });

  it('should copy', async function () {
    const person = await Person.create({ name: 'a' }).save();
    assert.equal(person.isNew, false);
    assert.equal(await Person.count(), 1);

    const person2 = person.copy();
    assert.equal(person2.isNew, true);
    await person2.save();

    assert.equal(await Person.count(), 2);
  });

  it('should work with id set explicitly', async function () {
    await Person.create({ id: 123 }).save();
    assert.equal(await Person.count(), 1);
    const persons = await Person.find();
    assert.equal(persons[0].id, '123');
  });
});
