/* eslint-env mocha*/
/* eslint-disable strict, no-console, no-func-assign*/

const assert = require('assert');
const _ = require('underscore');

describe('wrap', () => {
  const fibext = require('../index');
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
    doAsync = fibext.wrap(doAsync);
    doAsyncWithError = fibext.wrap(doAsyncWithError);
    fibext(() => {
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.throws(() => {
        doAsyncWithError();
      });
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
    lib = fibext.wrap(lib);
    fibext(() => {
      assert.equal(lib.doAsync(), 'doAsyncReturn');
      assert.throws(() => {
        lib.doAsyncWithError();
      });
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
    doAsync = fibext.wrap(doAsync);
    fibext(() => {
      const fiber = fibext();
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.throws(() => { // no doAsync2 method
        doAsync.doAsync2((err, data) => {
          fiber.resume(err, data);
        });
        fiber.wait();
      }, /has\sno\smethod\s'doAsync2'/);
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
    doAsync = fibext.wrap(doAsync, true);
    fibext(() => {
      assert.equal(doAsync(), 'doAsyncReturn');
      assert.equal(doAsync.doAsync2(), 'doAsync2Return');
    }, done);
  });

  it('can wrap the fs.readFile funtion', (done) => {
    const fs = require('fs');
    fs.writeFileSync('./wrap-file', 'function wrap');

    const readFile = fibext.wrap(fs.readFile);
    fibext(() => {
      assert.equal(readFile('./wrap-file'), 'function wrap');
      assert.equal(fibext.wrap(fs.readFile)('./wrap-file'), 'function wrap');
      assert.throws(() => {
        fs.readFile();
      });
    }, done);
  });

  it('can wrap the node-style object with some functions', (done) => {
    const fs = require('fs');
    fs.writeFileSync('./wrap-file', 'obj wrap');

    const nfs = fibext.wrap(_.pick(fs, 'readFile'));
    fibext(() => {
      assert.equal(nfs.readFile('./wrap-file'), 'obj wrap');
      assert.throws(() => {
        nfs.readFile();
      });
    }, done);
  });


  it('can wrap the node-style object', (done) => {
    let fs = require('fs');
    fs.writeFileSync('./wrap-file', 'obj wrap all');

    fs = _.extend({}, fs, fibext.wrap(_.pick(fs, 'readFile')));
    fibext(() => {
      assert.equal(fs.readFile('./wrap-file'), 'obj wrap all');
      assert.throws(() => {
        fs.readFile();
      });
      assert.equal(fs.readFileSync('./wrap-file'), 'obj wrap all');
    }, done);
  });

  it('can wrap the sync-callback function', (done) => {
    let doSync = function (cb) {
      cb();
    };
    doSync = fibext.wrap(doSync);
    fibext(() => {
      doSync();
    }, done);
  });


  it('can wrap the sync-callback function with error and return', (done) => {
    let doSync1 = function (cb) {
      cb(new Error('sync1'));
    };
    doSync1 = fibext.wrap(doSync1);
    let doSync2 = function (cb) {
      cb(null, 'sync2');
    };
    doSync2 = fibext.wrap(doSync2);
    fibext(() => {
      assert.throws(() => {
        doSync1();
      }, /sync1/);
      assert.equal(doSync2(), 'sync2');
    }, done);
  });

  after(() => {
    const fs = require('fs');
    fs.existsSync('./wrap-file') && fs.unlinkSync('./wrap-file');
  });
});
