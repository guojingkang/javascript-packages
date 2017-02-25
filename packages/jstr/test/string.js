/* eslint-env mocha*/


const assert = require('assert');
const fibext = require('fibext');
const KVCM = require('kv-cache-manager');
const jstr = require('..');

describe('render string', () => {
  describe('<@...@>', () => {
    it('should render', () => {
      const r = jstr();
      const string = '<@name@>';
      const echo = r.render(string, { name: 'hello world' });
      assert.equal(echo, 'hello world');
    });

    it('should escape the expression result', () => {
      const r = jstr();
      const string = '<@name@>';
      const echo = r.render(string, { name: '<span>hi' });
      assert.equal(echo, '&lt;span&gt;hi');
    });

    it('should render right with double-quote', () => {
      const r = jstr();
      const string = '<span style="\\"" name=\'\'><@name@>';
      const echo = r.render(string, { name: 'hi' });
      assert.equal(echo, '<span style="\\"" name=\'\'>hi');
    });

    it('should catch the syntax error with line no', () => {
      const r = jstr();
      shouldHasError(() => {
        r.render('<@,@>', {});
      }, 'SyntaxError', 1);
      shouldHasError(() => {
        r.render('\n<@,@>', {});
      }, 'SyntaxError', 2);
    });

    it('should catch the runtime error with line no', () => {
      const r = jstr();
      shouldHasError(() => {
        r.render('<@name@>', {});
      }, 'ReferenceError', 1);
      shouldHasError(() => {
        r.render('\n\r\n<@name@>', {});
      }, 'ReferenceError', 3);
    });

    it('should render with inner cache', () => {
      const r = jstr({ cache: true });
      assert.equal(r.render('<@name@>', { name: 'kiliwalk' }, 'xxx.js'), 'kiliwalk');
      assert.equal(r.render('hello <@name@>', { name: 'kiliwalk' }, 'xxx.js'), 'kiliwalk');
    });

    it('should render with specified cache', (done) => {
      fibext(() => {
        const cache = new KVCM.MemoryStore();
        const r = jstr({ cache });
        assert.equal(r.render('<@name@>', { name: 'kiliwalk' }, 'xxx.js'), 'kiliwalk');
        assert.equal(typeof cache.get('jstr-func/xxx.js'), 'function');
        assert.equal(r.render('hello <@name@>', { name: 'kiliwalk' }, 'xxx.js'), 'kiliwalk');
      }, done);
    });
  });
});

function shouldHasError(fn, type, line, filePath) {
  try {
    fn();
  } catch (err) {
    assert.equal(err.name, type);

    if (filePath) {
      assert(err.message.indexOf(`in file ${filePath}:${line}`) >= 0);
    } else {
      assert(err.message.indexOf(`in line:${line}`) >= 0);
    }
    assert.equal(err.line, line);
  }
}
