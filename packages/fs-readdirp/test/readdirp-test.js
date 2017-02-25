/* eslint-env mocha*/
/* eslint-disable strict*/

const path = require('path');
const fs = require('fs-extra');
const assert = require('assert');
const _ = require('underscore');

describe('fs-readdirp', function () {
  let expectFiles = [];
  before(function () {
    expectFiles = ['dir1',
      'dir1\\dir11',
      'dir1\\dir11\\dir111',
      'dir1\\dir11\\dir111\\file1111.txt',
      'dir1\\dir11\\dir111\\file1112.txt',
      'dir1\\dir11\\dir111\\file1113.txt',
      'dir1\\dir11\\dir112',
      'dir1\\dir12',
      'dir1\\dir12\\dir121',
      'dir1\\dir12\\dir121\\file1211.txt',
      'dir1\\file11.txt',
      'dir2',
      'dir2\\file21.txt',
      'dir3',
      'dir4',
      'dir4\\dir41',
      'dir4\\dir41\\file411.txt',
      'dir4\\dir42'];
    for (const i in expectFiles) {
      let file = expectFiles[i];
      file = expectFiles[i] = file.replace(/\\/g, path.sep);
      if (!path.extname(file)) {
        fs.mkdirpSync(path.join('./dir', file));
      } else fs.writeFileSync(path.join('./dir', file), file);
    }
  });

  const lib = require('../index');

  it('readdirpSync without filter', function () {
    const files = lib.readdirpSync('./dir');
    assert.equal(files.length, expectFiles.length);
  });

  it('readdirpSync with filter: relative path', function () {
    const files = lib.readdirpSync('./dir', function (filePath, stats) {
      return path.relative('./dir', filePath);
    });

    assert(_.isEqual(files, expectFiles));
  });

  it('readdirp without filter', function (done) {
    lib.readdirp('./dir', null, function (err, files) {
      assert.equal(err, null);
      assert.equal(files.length, expectFiles.length);
      done();
    });
  });

  it('readdirp with sync filter: relative path', function (done) {
    lib.readdirp('./dir', function (filePath, stats) {
      return path.relative('./dir', filePath);
    }, function (err, files) {
      assert.equal(err, null);
      assert.equal(files.length, expectFiles.length);
      done();
    });
  });

  it('readdirp with async filter: relative path', function (done) {
    lib.readdirp('./dir', function (filePath, stats, cb) {
      cb(null, path.relative('./dir', filePath));
    }, function (err, files) {
      assert.equal(err, null);
      assert.equal(files.length, expectFiles.length);
      done();
    });
  });


  it('readdirpSync with filter: ignore a dir', function () {
    const files = lib.readdirpSync('./dir', function (filePath, stats) {
      const rel = path.relative('./dir', filePath);
      if (rel === 'dir1') return false;
      return rel;
    });
    assert.equal(files.length, expectFiles.length - 1);
  });

  it('readdirp with filter: ignore a dir', function (done) {
    lib.readdirp('./dir', function (filePath, stats, cb) {
      const rel = path.relative('./dir', filePath);
      if (rel === 'dir1') return cb(null, false);
      cb(null, rel);
    }, function (err, files) {
      assert.equal(err, null);
      assert.equal(files.length, expectFiles.length - 1);
      done();
    });
  });


  it('readdirp with filter: ignore a dir and its children', function (done) {
    lib.readdirp('./dir', function (filePath, stats, cb) {
      const rel = path.relative('./dir', filePath);
      if (rel === 'dir1') {
        stats.isDirectory = function () { return false; };
        return cb(null, false);
      }
      cb(null, rel);
    }, function (err, files) {
      assert.equal(err, null);

      let count = 0;
      for (const i in expectFiles) {
        if (expectFiles[i].indexOf('dir1') === 0) continue;
        count++;
      }
      assert.equal(files.length, count);

      done();
    });
  });

  it('readdirpSync with filter: ignore a dir and its children', function () {
    const files = lib.readdirpSync('./dir', function (filePath, stats) {
      const rel = path.relative('./dir', filePath);
      if (rel === 'dir1') {
        stats.isDirectory = function () { return false; };
        return false;
      }
      return rel;
    });

    let count = 0;
    for (const i in expectFiles) {
      if (expectFiles[i].indexOf('dir1') === 0) continue;
      count++;
    }
    assert.equal(files.length, count);
  });


  it('readdirp with async filter: remove a dir', function (done) {
    lib.readdirp('./dir', function (filePath, stats, cb) {
      const rel = path.relative('./dir', filePath);
      if (rel === 'dir1') {
        fs.remove(filePath, function (err) {
          if (err) return cb(err);
          // stats.isDirectory = function(){return false;};
          cb(null, false);
        });
      } else cb(null, rel);
    }, function (err, files) {
      assert.equal(err, null);

      let count = 0;
      for (const i in expectFiles) {
        if (expectFiles[i].indexOf('dir1') === 0) continue;
        count++;
      }
      assert.equal(files.length, count);

      done();
    });
  });


  it('readdirpSync with filter error', function () {
    assert.throws(function () {
      lib.readdirpSync('./dir', function (filePath, stats) {
        throw new Error('error');
      });
    });
  });

  it('readdirp with filter error', function (done) {
    lib.readdirp('./dir', function (filePath, stats) {
      throw new Error('error');
    }, function (err, files) {
      assert(err);
      done();
    });
  });


  it('readdirp with async filter error', function (done) {
    lib.readdirp('./dir', function (filePath, stats, cb) {
      cb(new Error('error'));
    }, function (err, files) {
      assert(err);
      done();
    });
  });


  after(function () {
    fs.removeSync('./dir');
  });
});
