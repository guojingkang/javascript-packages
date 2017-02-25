

const Store = require('./store');
const path = require('path');
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const exec = require('child_process').exec;
const base64 = require('base64-ext');
const a2p = require('./util').a2p;
const writeFile = a2p(fs.writeFile),
  readFile = a2p(fs.readFile),
  unlink = a2p(fs.unlink),
  mkdir = a2p(fs.mkdir);// , readdir = a2p(fs.readdir)

class FileStore extends Store {
  constructor(options) {
    super(options);
    options || (options = {});

    this.name = this._name = options.name || 'file';

    if (options.prefix) {
      throw new Error('prefix option is not supported in file store');
    }

    this._dir = path.resolve(options.dir || 'kvcache');
    try {
      fs.accessSync(this._dir, fs.R_OK | fs.W_OK);
    } catch (e) {
      throw new Error('file cache dir cannot be accessed');
    }
  }

  _set(kvs, options) {
    let size = 0;// bytes

    return Promise.all(Object.keys(kvs).map((key) => {
      const item = JSON.stringify(kvs[key]);
      if (options.returnSize) size += Buffer.byteLength(item, 'utf8');

      const filePath = path.join(this._dir, base64.encodeURL(key));
      return writeFile(filePath, item).catch((e) => {});
    })).then(() => {
      if (options.returnSize) return { size };
    });
  }

  _mget(keys) {
    return Promise.all(keys.map((key) => {
      const filePath = path.join(this._dir, base64.encodeURL(key));
      return readFile(filePath, 'utf8').catch(e => undefined);
    })).then(items => items.reduce((result, item, index) => {
      const key = keys[index];
      if (item) {
        try {
          item = JSON.parse(item);
        } catch (e) {
          item = undefined;
        }
      }
      if (!item) item = undefined;
      result[key] = item;
      return result;
    }, {}));
  }

  _del(keys) {
    return Promise.all(keys.map((key) => {
      const filePath = path.join(this._dir, base64.encodeURL(key));
      return unlink(filePath).catch(e => undefined);
    }));
  }

  _keys(re) {
    throw new Error('keys() currently is not supported in file store');
  }

  _clear() {
    return new Promise((resolve, reject) => {
      exec(`rm -r ${this._dir}`, (err, stdout, stderr) => {
        if (err || stderr) return reject(err || stderr);
        else return resolve();
      });
    }).then(() => mkdir(this._dir));
  }
}

module.exports = FileStore;
