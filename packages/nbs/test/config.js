/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');
const _ = require('underscore');

describe('config', () => {
  const nbs = require('../index');
  const defConf = _.extend({}, nbs.config());

  it('should use the conf error handler', (done) => {
    nbs.config({ onError(err) {
      assert.equal(err.message, 'hello');
      done();
    } });
    nbs.run(() => {
      throw new Error('hello');
    });
  });

  it('should reset config', () => {
    assert(!_.isEqual(nbs.config(), defConf));
    assert(_.isEqual(nbs.resetConfig(), defConf));
  });

  it('should pass the invalid config', () => {
    assert(_.isEqual(nbs.config(1), defConf));
    assert(_.isEqual(nbs.config('111'), defConf));
    assert(_.isEqual(nbs.config({ onError: 111, onSubError: 11 }), defConf));
  });

  after(() => {
    nbs.resetConfig();
  });
});
