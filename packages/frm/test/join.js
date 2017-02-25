/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('join', function () {
  let Animal,
    Cage,
    Person,
    Home;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', { name: String, male: Boolean, homeId: String });

    // animal belongs to a person
    Animal = frm.model('Animal', { personId: String, name: String });
    Animal.def.add('join', Person);
    Animal.def.add('field', {
      personName: { join: Person, column: 'name', type: String },
      personMale: { join: Person, column: 'male', type: Boolean },
    });

    // cage belongs to a animal
    Cage = frm.model('Cage', { name: String, animalId: String });
    Cage.def.add('join', { name: 'animal', model: Animal });
    Cage.def.add('field', {
      animalName: { join: 'animal', column: 'name', type: String },
      personId: { join: 'animal', column: 'person_id', type: String },
    });
    Cage.def.add('join', { name: 'p', model: Person, on: [{ column: 'id', type: 'field', value: 'personId' }] });
    Cage.def.add('field', {
      personName: { join: 'p', column: 'name', type: String },
      personMale: { join: 'p', column: 'male', type: Boolean },
    });

    // person must have a home
    Home = frm.model('Home', { addr: String });
    Person.def.add('join', { model: Home, left: false });
    Person.def.add('field', {
      homeAddr: { join: Home, column: 'addr', type: String },
    });

    await frm.ensure();
    const home1 = await Home.create({ addr: 'Beijing' }).save();
    const person1 = await Person.create({ name: 1, male: true, homeId: home1.id }).save();
    const person2 = await Person.create({ name: 2, male: false }).save();
    const animal1 = await Animal.create({ name: 'cat', personId: person1.id }).save();
    await Animal.create({ name: 'dog', personId: person1.id }).save();
    await Cage.create({ name: 'A1', animalId: animal1.id }).save();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await common.dropTable(frm, 'animal');
    await common.dropTable(frm, 'cage');
    await common.dropTable(frm, 'home');
    await frm.close();
  });

  it('should return the join field right', async function () {
    let animal = await Animal.findOne({ fields: 'name,personName', filter: { name: 'cat' } });
    assert.equal(animal.name, 'cat');
    assert.equal(animal.personName, '1');

    animal = await Animal.findOne({ fields: 'name,personName,personMale', filter: { name: 'cat' } });
    assert.equal(animal.name, 'cat');
    assert.equal(animal.personName, '1');
    assert.equal(animal.personMale, true);
  });

  it('should return the join field right in cascade join', async function () {
    const cage = await Cage.findOne({ fields: 'name,animalName,personName', filter: { name: 'A1' } });
    assert.equal(cage.name, 'A1');
    assert.equal(cage.animalName, 'cat');
    assert.equal(cage.personName, '1');
  });

  it('should not write the join field to frm', async function () {
    let animal = await Animal.findOne({ fields: 'id,name,personName', filter: { name: 'cat' } });
    animal.personName = 'a', animal.save();
    assert.equal(animal.personName, 'a');
    animal = await Animal.findOne({ fields: 'name,personName', filter: { name: 'cat' } });
    assert.equal(animal.personName, '1');
  });

  it('should return right with join query', async function () {
    let persons = await Person.find({ fields: 'id, name' });
    assert.equal(persons.length, 2);
    assert.equal(persons[0].name, '1');
    assert.equal(persons[1].name, '2');

    persons = await Person.find({ fields: 'id, name', joins: 'Home' });
    assert.equal(persons.length, 1);
    assert.equal(persons[0].name, '1');
  });
});
