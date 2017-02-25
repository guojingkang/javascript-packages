/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const util = require('../lib/util'),
  format = util.formatDate;
const common = require('./fixtures/common');

describe('frm.types.Date', function () {
  let frm;
  beforeEach(async function () {
    frm = common.mysql();
    assert.equal(await common.hasTable(frm, 'person'), false);
  });
  afterEach(async function () {
    await common.dropTable(frm, 'person');
    await frm.close();
  });

  it('should save with default pattern correctly', async function () {
    const Person = frm.model('Person', { start: Date });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'start', 'datetime'), true);

    const now = new Date();
    await Person.create({ start: now }).save();
    assert.strictEqual(format((await Person.findOne()).start), format(now));
  });

  it('should save with `datetime` pattern correctly', async function () {
    const Person = frm.model('Person', { start: { type: Date, pattern: 'datetime' } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'start', 'datetime'), true);

    const now = new Date();
    await Person.create({ start: now }).save();
    assert.strictEqual(format((await Person.findOne()).start), format(now));
  });

  it('should save with `date` pattern correctly', async function () {
    const Person = frm.model('Person', { start: { type: Date, pattern: 'date' } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'start', 'date'), true);

    const now = new Date();
    await Person.create({ start: now }).save();
    now.setHours(0, 0, 0, 0);
    assert.strictEqual(format((await Person.findOne()).start), format(now));
  });

  it('should save with `time` pattern correctly', async function () {
    const Person = frm.model('Person', { start: { type: Date, pattern: 'time' } });
    await frm.ensure();
    assert.equal(await common.hasColumn(frm, 'person', 'start', 'time'), true);

    const now = new Date();
    await Person.create({ start: now }).save();
    assert.strictEqual(format((await Person.findOne()).start), format(now));
  });

  it('should normalize the value when set/get', async function () {
    const Person = frm.model('Person', { start: Date });
    await frm.ensure();
    const now = new Date();
    const person = Person.create({ start: now });

    assert.notEqual(person.start, now);
    assert.strictEqual(format(person.start), format(now));
    await person.save();
    assert.strictEqual(format((await Person.findOne()).start), format(now));
  });

  it('should override Date.toString/toJSON/inspect methods', async function () {
    const Person = frm.model('Person', { dt: Date, d: { type: Date, pattern: 'date' }, t: { type: Date, pattern: 'time' } });
    const now = new Date();
    const person = Person.create({ dt: now, d: now, t: now });

    const util = require('util');
    assert.equal(util.inspect(person.dt), format(now));
    assert.equal(`${person.dt}`, format(now));
    assert.equal(JSON.stringify(person.dt), `"${format(now)}"`);

    assert.equal(util.inspect(person.d), format(now, 'date'));
    assert.equal(`${person.d}`, format(now, 'date'));
    assert.equal(JSON.stringify(person.d), `"${format(now, 'date')}"`);

    assert.equal(util.inspect(person.t), format(now, 'time'));
    assert.equal(`${person.t}`, format(now, 'time'));
    assert.equal(JSON.stringify(person.t), `"${format(now, 'time')}"`);
  });

  it('should realize the value change correctly', async function () {
    const Person = frm.model('Person', { start: Date });
    await frm.ensure();
    const now = new Date();
    const person = await Person.create({ start: now }).save();

    person.start.setSeconds(1);
    assert.strictEqual(format(person.start), format(now));

    const start = person.start;
    start.setSeconds(2);
    person.start = start;
    assert.strictEqual(format(person.start), format(start));
    assert.notEqual(format(person.start), format(now));

    await person.save();
    assert.strictEqual(format((await Person.findOne()).start), format(start));
  });

  it('should work with null value', async function () {
    const Person = frm.model('Person', { start: Date });
    await frm.ensure();
    const person = await Person.create({ start: null }).save();

    const now = Date.now();
    person.start = now;
  });

  describe('normalize different type', function () {
    let field;
    before(async function () {
      const Type = frm.model('Type', { start: Date });
      field = Type.def.fields.start;
    });
    it('should work with number', function () {
      const dt = new Date();
      dt.setTime(1);
      assert.strictEqual(format(field.normalize(1)), format(dt));
      assert.strictEqual(format(field.normalize(1.2)), format(dt));
    });
    it('should work with null/undefined', function () {
      assert.strictEqual(field.normalize(null), null);
      assert.strictEqual(field.normalize(undefined), null);
    });
    it('should work with boolean', function () {
      assert.strictEqual(field.normalize(false), null);
      assert.strictEqual(field.normalize(true), null);
    });
    it('should work with string', function () {
      const dt = new Date();
      dt.setHours(13, 1, 1);
      assert.strictEqual(format(field.normalize('13:1:1')), format(dt));

      dt.setFullYear(2015, 0, 1);
      assert.strictEqual(format(field.normalize('2015/01/01 13:1:1')), format(dt));

      dt.setHours(0, 0, 0, 0);
      assert.strictEqual(format(field.normalize('2015/01/01')), format(dt));
    });
  });
});
