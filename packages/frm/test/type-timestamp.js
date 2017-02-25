/* eslint-env mocha*/

const assert = require('assert');
const common = require('./fixtures/common');

describe('frm.types.Timestamp', function () {
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
    const Person = frm.model('Person', { ts: 'Timestamp' });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'ts', 'bigint(20)'), true);

    const now = new Date();
    await Person.create({ ts: now }).save();
    assert.strictEqual((await Person.findOne()).ts, now.getTime());
  });

  describe('normalize different type', function () {
    let field;
    before(async function () {
      const Type = frm.model('Type', { ts: 'Timestamp' });
      field = Type.def.fields.ts;
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
      assert.strictEqual(field.normalize(now), now.getTime());
    });
  });
});
