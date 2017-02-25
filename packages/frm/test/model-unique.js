/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');
const frm = common.mysql();

describe('unique', function () {
  let Person;
  before(async function () {
    assert.equal(await common.hasTable(frm, 'person'), false);
    Person = frm.model('Person', { name: { type: String, unique: true }, num: Number, int: 'Integer' }, {
      indexes: [{ fields: ['num', 'int'], unique: true, message: 'num and int should be unique' }],
    });
    await frm.ensure();
  });
  after(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });
  beforeEach(async function () {
    await Person.create({ name: '1', int: 1, num: 1 }).save();
  });
  afterEach(async function () {
    await Person.remove({ filter: {} });
  });
  describe('id field', function () {
    it('should work on create then save', async function () {
      await Person.create({ id: '1', name: '2' }).save();
      try {
        await Person.create({ id: '1', name: '3' }).save();
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'ER_DUP_ENTRY: Duplicate entry \'1\' for key \'PRIMARY\'');
      }
    });
  });
  describe('single field', function () {
    it('should work on create then save', async function () {
      try {
        await Person.create({ name: '1' }).save();
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'name is unique');
      }
    });

    it('should work on update then save', async function () {
      try {
        const person = await Person.create({ name: '2' }).save();
        person.name = '1';
        await person.save();
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'name is unique');
      }
    });
    it('should work on insert', async function () {
      try {
        await Person.insert({ name: '1' });
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'name is unique');
      }
    });
    it('should work on batch insert', async function () {
      try {
        await Person.insert([{ name: '2' }, { name: '1' }]);
        assert(false);
      } catch (e) {
        assert.equal(await Person.count(), 1);
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'name is unique');
      }
    });
    it('should work on update', async function () {
      try {
        await Person.create({ name: '2' }).save();
        await Person.update({ set: { name: '1' }, filter: { name: '2' } });
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'name is unique');
      }
    });
  });

  describe('multiple fields', function () {
    it('should work on create then save', async function () {
      try {
        await Person.create({ int: 1, num: 1 }).save();
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'num and int should be unique');
      }
    });

    it('should work on update then save', async function () {
      try {
        const person = await Person.create({ int: 2, num: 1 }).save();
        person.int = 1;
        await person.save();
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'num and int should be unique');
      }
    });
    it('should work on insert', async function () {
      try {
        await Person.insert({ int: 1, num: 1 });
        assert(false);
      } catch (e) {
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'num and int should be unique');
      }
    });
    it('should work on batch insert', async function () {
      try {
        await Person.insert([{ int: 2, num: 1 }, { int: 1, num: 1 }]);
        assert(false);
      } catch (e) {
        assert.equal(await Person.count(), 1);
        assert.equal(e.statusCode, 409);
        assert.equal(e.message, 'num and int should be unique');
      }
    });
    it('should work on update', async function () {
      try {
        await Person.create({ int: 2, num: 1 }).save();
        await Person.update({ set: { int: 1, num: 1 }, filter: { int: 2 } });
        assert(false);
      } catch (e) {
        assert.equal(e.message, 'num and int should be unique');
        assert.equal(e.statusCode, 409);
      }
    });
  });
});
