/* eslint-env mocha*/
/* eslint no-console:0*/


const assert = require('assert');
const fs = require('fs');
const fibext = require('fibext');
const jstr = require('..');
const path = require('path');
const after = require('after');

describe('render file', () => {
  it('should render single file', (done) => {
    renderFile('single',
      { name: 'kiliwalk', arr: [1, 2, 3], obj: { k1: 'v1', k2: 'v2', k3: 'v3' }, bool: true },
    done);
  });

  it('should catch the error and the line no in file', (done) => {
    const cb = after(2, done);
    renderFile('single',
      {},
    (err) => {
      shouldHasError(err, 'ReferenceError', 3, 'single');
      cb();
    });

    renderFile('single',
      { name: '' },
    (err) => {
      shouldHasError(err, 'ReferenceError', 4, 'single');
      cb();
    });
  });

  it('should include a file from const file name', (done) => {
    renderFile('const-include',
      { name: 'kiliwalk' },
    done);
  });

  it('should include a file from dynamic file name', (done) => {
    renderFile('dynamic-include',
      { name: 'kiliwalk', partName: 'part', fileName: 'include/part.html' },
    done);
  });

  it('should warn with an single-line comment', (done) => {
    const warn = console.warn;
    console.warn = function () {
      const str = require('util').format.apply(null, arguments);
      const filePath = path.join(__dirname, 'fixtures', 'single-line-comment.html');
      assert.equal(str, `detect a possible single-line comment in file ${filePath}: if(true){//some comments here`);
      console.warn = warn;
    };
    renderFile('single-line-comment',
      {},
    done);
  });
});

function renderFile(filename, vars, done) {
  const r = jstr({ debug: false });
  fibext(() => {
    const result = fs.readFileSync(path.join(__dirname, 'fixtures', `${filename}.result.html`), 'utf8');

    const filePath = path.join(__dirname, 'fixtures', `${filename}.html`);
    assert.equal(r.renderFile(filePath, vars), result);
  }, done);
}

function shouldHasError(err, type, line, filename) {
  assert.equal(err.name, type);

  const filePath = path.join(__dirname, 'fixtures', `${filename}.html`);
  if (filePath) {
    assert(err.message.indexOf(`in file ${filePath}:${line}`) >= 0);
  } else {
    assert(err.message.indexOf(`in line:${line}`) >= 0);
  }
  assert.equal(err.line, line);
}
