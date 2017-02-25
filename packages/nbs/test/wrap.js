/* eslint-env mocha*/
/* eslint-disable strict, no-console, no-func-assign*/

const assert = require('assert');
const _ = require('underscore');

describe('wrap basic', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('can wrap the node-style async funtion', (done) => {
    function doAsync(cb) {
      setTimeout(() => {
        cb(null, 'doAsyncReturn');
      }, 5);
    }
    function doAsyncWithError(cb) {
      setTimeout(() => {
        cb(new Error('doAsyncError'));
      }, 5);
    }
    doAsync = nbs.wrap(doAsync);
    doAsyncWithError = nbs.wrap(doAsyncWithError);
    nbs.run(() => {
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.throws(() => {
        doAsyncWithError();
      });
      done();
    }, done);
  });

  it('can wrap the node-style object', (done) => {
    let lib = {
      doAsync(cb) {
        setTimeout(() => {
          cb(null, 'doAsyncReturn');
        }, 5);
      },
      doAsyncWithError(cb) {
        setTimeout(() => {
          cb(new Error('doAsyncError'));
        }, 5);
      },
    };
    lib = nbs.wrap(lib);
    nbs.run(() => {
      assert.equal(lib.doAsync(), 'doAsyncReturn');
      assert.throws(() => {
        lib.doAsyncWithError();
      });
      done();
    }, done);
  });


  it('can wrap the node-style function without deep', (done) => {
    let doAsync = function (cb) {
      setTimeout(() => {
        cb(null, 'doAsyncReturn');
      }, 5);
    };
    doAsync.doAsync2 = function (cb) {
      setTimeout(() => {
        cb(null, 'doAsync2Return');
      }, 5);
    };
    doAsync = nbs.wrap(doAsync);
    nbs.run(() => {
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.throws(() => {
        doAsync.doAsync2((err, data) => {
          resume(err, data);
        });
        wait();
      });

      done();
    }, done);
  });


  it('can wrap the node-style function with deep', (done) => {
    let doAsync = function (cb) {
      setTimeout(() => {
        cb(null, 'doAsyncReturn');
      }, 5);
    };
    doAsync.doAsync2 = function (cb) {
      setTimeout(() => {
        cb(null, 'doAsync2Return');
      }, 5);
    };
    doAsync = nbs.wrap(doAsync, true);
    nbs.run(() => {
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.equal(doAsync.doAsync2(), 'doAsync2Return');

      done();
    }, done);
  });

  it('can wrap the fs.readFile funtion', (done) => {
    const fs = require('fs');
    fs.writeFileSync('./wrap-file', 'function wrap');

    const readFile = nbs.wrap(fs.readFile);
    nbs.run(() => {
      assert.equal(readFile('./wrap-file'), 'function wrap');
      assert.throws(() => {
        fs.readFile();
      });
      done();
    }, done);
  });

  it('can wrap the node-style object with some functions', (done) => {
    const fs = require('fs');
    fs.writeFileSync('./wrap-file', 'obj wrap');

    const nfs = nbs.wrap(_.pick(fs, 'readFile'));
    nbs.run(() => {
      assert.equal(nfs.readFile('./wrap-file'), 'obj wrap');
      assert.throws(() => {
        nfs.readFile();
      });
      done();
    }, done);
  });


  it('can wrap the node-style object', (done) => {
    let fs = require('fs');
    fs.writeFileSync('./wrap-file', 'obj wrap all');

    fs = _.extend(fs, nbs.wrap(_.pick(fs, 'readFile')));
    nbs.run(() => {
      assert.equal(fs.readFile('./wrap-file'), 'obj wrap all');
      assert.throws(() => {
        fs.readFile();
      });
      assert.equal(fs.readFileSync('./wrap-file'), 'obj wrap all');
      done();
    }, done);
  });

  after(() => {
    const fs = require('fs');
    fs.unlinkSync('./wrap-file');
  });
});
