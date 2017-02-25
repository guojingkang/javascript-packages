/* eslint-env mocha*/
/* eslint-disable strict*/

const assert = require('assert');

describe('tree', () => {
  const Tree = require('../index.js');

  it('should output mlr right', () => {
    const tree = new Tree();
    tree.add('2.1.1.1', '2.1.1');
    tree.add('2.1.1.2', '2.1.1');
    tree.add('1.1', '1');
    tree.add('1.2', '1');
    tree.add('1.3', '1');
    tree.add('2.1', '2');
    tree.add('2.1.1', '2.1');
    tree.add('2.1.2', '2.1');
    const ids = tree.mlr().join(',');
    const exp = '1,1.1,1.2,1.3,2,2.1,2.1.1,2.1.1.1,2.1.1.2,2.1.2';
    assert.equal(ids, exp);
  });

  it('should output hier right', () => {
    const tree = new Tree();
    tree.add('2.1.1.1', '2.1.1');
    tree.add('2.1.1.2', '2.1.1');
    tree.add('1.1', '1');
    tree.add('1.2', '1');
    tree.add('1.3', '1');
    tree.add('2.1', '2');
    tree.add('2.1.1', '2.1');
    tree.add('2.1.2', '2.1');
    const ids = tree.hier();
    const exp = '[{"id":"1","children":[{"id":"1.1","children":[]},{"id":"1.2","children":[]},{"id":"1.3","children":[]}]},{"id":"2","children":[{"id":"2.1","children":[{"id":"2.1.1","children":[{"id":"2.1.1.1","children":[]},{"id":"2.1.1.2","children":[]}]},{"id":"2.1.2","children":[]}]}]}]';
    assert.equal(JSON.stringify(ids), exp);
  });

  it('should output hier with custom cb right', () => {
    const tree = new Tree();
    tree.add('2.1.1.1', '2.1.1', null, { name: '2.1.1.1' });
    tree.add('2.1.1.2', '2.1.1', null, { name: '2.1.1.2' });
    tree.add('1.1', '1', null, { name: '1.1' });
    tree.add('1.2', '1', null, { name: '1.2' });
    tree.add('1.3', '1', null, { name: '1.3' });
    tree.add('2.1', '2', null, { name: '2.1' });
    tree.add('2.1.1', '2.1', null, { name: '2.1.1' });
    tree.add('2.1.2', '2.1', null, { name: '2.1.2' });
    const ids = tree.hier(null, false, (id, seq, data) => ({ id, name: data && data.name }));
    const exp = '[{"id":"1","children":[{"id":"1.1","name":"1.1","children":[]},{"id":"1.2","name":"1.2","children":[]},{"id":"1.3","name":"1.3","children":[]}]},{"id":"2","children":[{"id":"2.1","name":"2.1","children":[{"id":"2.1.1","name":"2.1.1","children":[{"id":"2.1.1.1","name":"2.1.1.1","children":[]},{"id":"2.1.1.2","name":"2.1.1.2","children":[]}]},{"id":"2.1.2","name":"2.1.2","children":[]}]}]}]';
    assert.equal(JSON.stringify(ids), exp);
  });
});
