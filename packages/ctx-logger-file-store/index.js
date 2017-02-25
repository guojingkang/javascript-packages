(function(){
'use strict';

var path = require('path');
var util = require('util');
var fs = require('fs-extra');
var moment = require('moment');
var Store = require('ctx-logger').Store;

function FileStore(options){
  options || (options = {});

  Store.apply(this, arguments);

  this._dir = options.dir||'./logs';
  this._archiveDir = options.archiveDir||'';
  this._filename = options.filename||'%t.%p.log';
  this._dateFormat = options.dateFormat||'YYYYMMDD';

  this._filename = this._filename.replace('%p', process.pid);
  if(this._filename.indexOf('%t')>=0){
    this._dayRoll = true;
  }

  fs.mkdirpSync(this._dir);
  if(this._archiveDir){
    fs.mkdirpSync(this._archiveDir);
    fs.copySync(this._dir, path.join(this._archiveDir, moment().format('YYYYMMDD')), {
      clobber: true,
      preserveTimestamps: true
    });
    fs.emptyDirSync(this._dir);
  }
}
util.inherits(FileStore, Store);
module.exports = FileStore;

function getStream(now){
  var filePath;
  if(!this._dayRoll){
    if(this._stream) return this._stream;

    filePath = path.join(this._dir, this._filename);
  }
  else{
    var curDay = moment(now).format(this._dateFormat);
    if(this._prevDay && curDay!==this._prevDay){
      if(this._stream){
        this._stream.end();
        this._stream = null;
      }
    }
    this._prevDay = curDay;
    if(this._stream) return this._stream;

    filePath = path.join(this._dir, this._filename.replace('%t', curDay));
  }
  var stream = fs.createWriteStream(filePath, { defaultEncoding: 'utf8', 
    encoding: 'utf8', mode: parseInt('0644', 8), flags: 'a' });
  stream.on("error", function (err) {
    /*eslint-disable no-console*/
    console.error("error for context logger file store to write data: %s, %s", filePath, err);
    /*eslint-enable no-console*/
  });
  this._stream = stream;
  return stream;
}

FileStore.prototype.addLog = function(level, message, now){
  getStream.call(this, now).write(message+'\n');
};

FileStore.prototype.flush = function(cb){
  if(!this._stream) return cb && cb();

  if(cb) this._stream.end(cb);
  else this._stream.end();
  this._stream = null;
};

})();
