/* eslint-env mocha*/

const assert = require('assert');
const Frm = require('..');
const testParams = require('./fixtures/params');
const common = require('./fixtures/common');

describe('mysql', function () {
  describe('new', function () {
    it('should create a mysql connection from option', function () {
      const frm = new Frm(testParams.mysql.connOption);
      assert(!!frm);
      assert(!!frm.connection);
      return frm.close();
    });

    it('should create a mysql connection from url string', function () {
      const frm = new Frm(testParams.mysql.connString);
      assert(!!frm);
      assert(!!frm.connection);
      return frm.close();
    });
  });

  describe('#ensure()', function () {
    let frm,
      conn;
    after(function () {
      return frm && frm.close();
    });
    afterEach(async function () {
      if (!frm) return;
      await common.dropTable(frm, 'person');
      assert.equal(await common.hasTable(frm, 'person'), false);
      return frm.close();
    });
    it('should ensure the table created', async function () {
      frm = common.mysql(frm);
      assert.equal(await common.hasTable(frm, 'person'), false);
      frm.model('Person', { name: { type: String, length: 30 } });
      assert.equal(await common.hasTable(frm, 'person'), false);
      await frm.ensure();
      assert.equal(await common.hasTable(frm, 'person'), true);
      assert.equal(await common.hasColumn(frm, 'person', 'id'), true);
      assert.equal(await common.hasColumn(frm, 'person', 'name'), true);
    });
    it('should not re-create the existent table', async function () {
      frm = common.mysql(frm);
      assert.equal(await common.hasTable(frm, 'person'), false);
      frm.query('create table `person`(`value` varchar(30))');
      assert.equal(await common.hasColumn(frm, 'person', 'value'), true);

      frm.model('Person', { name: { type: String, length: 30 } });
      await frm.ensure();
      assert.equal(await common.hasColumn(frm, 'person', 'value'), true);
      assert.equal(await common.hasColumn(frm, 'person', 'id'), false);
      assert.equal(await common.hasColumn(frm, 'person', 'name'), false);
    });
    it('should create the unique index for unique=true field', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30, unique: true } });
      assert.equal(await conn.hasTable('person'), false);
      assert.equal(await conn.hasIndex('person', 'person_name'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_name'), true);
      const index = await conn.queryIndex('person', 'person_name');
      assert.deepEqual(index, { table: 'person', name: 'person_name', columns: ['name'], unique: true });
    });
    it('should not re-create the existent index', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30, unique: true } });
      await frm.ensure();
      assert.equal(await conn.hasIndex('person', 'person_name'), true);

      frm = common.mysql(frm), conn = frm.connection;
      frm.model('Person', { name: { type: String, length: 30 } }, { indexes: [
        { fields: ['name'] },
      ] });
      await frm.ensure();
      const index = await conn.queryIndex('person', 'person_name');
      assert.equal(index.unique, true);
    });

    it('should create the primary index of id field', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30, unique: true } });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'PRIMARY'), true);
      const index = await conn.queryIndex('person', 'PRIMARY');
      assert.deepEqual(index, { table: 'person', name: 'PRIMARY', columns: ['id'], unique: true });
    });
    it('should create single unique index', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30, unique: true } });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_name'), true);
      const index = await conn.queryIndex('person', 'person_name');
      assert.deepEqual(index, { table: 'person', name: 'person_name', columns: ['name'], unique: true });
    });
    it('should create single normal index', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30 } }, { indexes: [
        { fields: ['name'] },
      ] });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_name'), true);
      const index = await conn.queryIndex('person', 'person_name');
      assert.deepEqual(index, { table: 'person', name: 'person_name', columns: ['name'], unique: false });
    });
    it('should create index with specified name', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30 } }, { indexes: [
        { name: 'the_name', fields: ['name'] },
      ] });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_the_name'), true);
      const index = await conn.queryIndex('person', 'person_the_name');
      assert.deepEqual(index, { table: 'person', name: 'person_the_name', columns: ['name'], unique: false });
    });
    it('should create composite normal index', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30 }, int: { type: 'Integer' } }, { indexes: [
        { fields: ['name', 'int'] },
      ] });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_name_int'), true);
      const index = await conn.queryIndex('person', 'person_name_int');
      assert.deepEqual(index, { table: 'person', name: 'person_name_int', columns: ['name', 'int'], unique: false });
    });
    it('should create composite unique index', async function () {
      frm = common.mysql(frm), conn = frm.connection;
      assert.equal(await conn.hasTable('person'), false);
      frm.model('Person', { name: { type: String, length: 30 }, int: { type: 'Integer' } }, { indexes: [
        { fields: ['name', 'int'], unique: true, message: 'xxx' },
      ] });
      assert.equal(await conn.hasTable('person'), false);
      await frm.ensure();
      assert.equal(await conn.hasTable('person'), true);
      assert.equal(await conn.hasIndex('person', 'person_name_int'), true);
      const index = await conn.queryIndex('person', 'person_name_int');
      assert.deepEqual(index, { table: 'person', name: 'person_name_int', columns: ['name', 'int'], unique: true });
    });
  });
});

