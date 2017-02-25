/* eslint-env mocha*/
/* eslint-disable strict*/

const fs = require('fs');
const assert = require('assert');

describe('js-conf', () => {
  const jc = require('../index.js');
  const sNoVarData = '{i:1,"b":true,"f":1.2,"s":\'abc\'}';
  let noVarData;
  eval(`noVarData = ${sNoVarData}`);

  function append(str) { return `${str}d`; }
  const sVarData = '{i:1,"b":true,"f":1.2,"s":\'abc\', s1: "abc".toUpperCase(), s2: append("abc")}';
  let varData;
  eval(`varData = ${sVarData}`);

  before(() => {
    fs.writeFileSync('./no-var.conf', sNoVarData);
    fs.writeFileSync('./var.conf', sVarData);
  });

  it('should sync to get conf without any variable', () => {
    const conf = jc.readFileSync('./no-var.conf');
    assert.equal(JSON.stringify(conf), JSON.stringify(noVarData));
  });

  it('should async to get conf without any variable', (done) => {
    jc.readFile('./no-var.conf', (err, conf) => {
      assert.equal(JSON.stringify(conf), JSON.stringify(noVarData));
      done();
    });
  });


  it('should sync to get conf with variable', () => {
    const conf = jc.readFileSync('./var.conf', { append });
    assert.equal(JSON.stringify(conf), JSON.stringify(varData));
  });

  it('should async to get conf with variable', (done) => {
    jc.readFile('./var.conf', { append }, (err, conf) => {
      assert.equal(JSON.stringify(conf), JSON.stringify(varData));
      done();
    });
  });

  it('should has right prototype', () => {
    const conf = jc.readFileSync('./no-var.conf');
    assert.equal(Object.getPrototypeOf(conf), Object.prototype);
  });

  after(() => {
    fs.unlinkSync('./var.conf');
    fs.unlinkSync('./no-var.conf');
  });
});
