(function(){
'use strict';

var path = require('path');
var fs = require('fs-extra');
var readdirp = require('fs-readdirp').readdirp;

function FileStore(options){
  options || (options = {});

  this._ttl = options.ttl || 0;//ms, 0 for unlimited
  this._dir = options.dir || './fs-cache';
  fs.mkdirpSync(this._dir);
}
module.exports = FileStore;


var zeros = '0000000000';
function leftPad0(str, minLen){
  str += '';
  return zeros.substring(0, Math.max(minLen-str.length, 0))+str;
}
function formatDate(ms){
  var now = new Date();
  now.setTime(ms);
  return now.getFullYear()+'-'+
    leftPad0(now.getMonth()+1, 2)+'-'+
    leftPad0(now.getDate(), 2)+' '+
    leftPad0(now.getHours(), 2)+':'+
    leftPad0(now.getMinutes(), 2)+':'+
    leftPad0(now.getSeconds(), 2)+'.'+
    leftPad0(now.getMilliseconds(), 3);
}

function mkdirp(dirname, cb){
  fs.mkdirp(dirname, function (err) {
    if (err){
      if(err.code==='EEXIST'){//it's a file, remove it
        err.path && fs.remove(err.path);
        mkdirp(dirname, cb);
      }
      else return cb(err);
    }
    else cb();
  });
}

function writeFile(filePath, content, got, wrong){
  mkdirp(path.dirname(filePath), function(err){
    if(err) return wrong(err);
    
    fs.lstat(filePath, function(err, stats){
      if(stats && stats.isDirectory()){
        fs.remove(filePath, function(err){
          if(err) wrong(err);
          else{
            fs.writeFile(filePath, content, function(err){
              if(err) return wrong(err);
              got();
            });
          }
        });
      }
      else{
        fs.writeFile(filePath, content, function(err){
          if(err) return wrong(err);
          got();
        });
      }
    });
  });
}

//set the key
FileStore.prototype.set = function(kvs, options, done){
  var self = this;
  options || (options = {});
  var pending = Object.keys(kvs).length, hasError = false;

  function got(){
    if(!--pending) return done(null);
  }
  function wrong(err){
    if(!hasError){
      hasError = true;
      done(err);
    }
  }

  for(var key in kvs){
    var value = kvs[key];

    var filePath = path.join(self._dir, key);
    if(!path.relative(self._dir, filePath)){
      got();
      continue;
    }

    var ttl = +(options.ttl || this._ttl);
    var data = {value: value};
    if(ttl){
      data.expire = Date.now()+ttl;
      data.expireTime = formatDate(data.expire);
    }
    
    writeFile(filePath, JSON.stringify(data), got, wrong);
  }
};

function readFile(key, filePath, got, wrong){
  fs.readFile(filePath, {encoding: 'utf8'}, function(err, content){
    if(err) return got(key);//miss
    if(!content) return got(key);

    var data = null;
    try{
      data = JSON.parse(content);
    }catch(e){
      return wrong(new Error('parse file cache error: '+e.message+content));
    }
    if(data.expire && Date.now()>data.expire){
      return got(key);
    }
    return got(key, data.value);
  });
}

FileStore.prototype.mget = function(keys, done){
  var self = this;
  var pending = keys.length, hasError = false;
  var ret = {};

  function got(key, value){
    ret[key] = value;
    if(!--pending) return done(null, ret);
  }
  function wrong(err){
    if(!hasError){
      hasError = true;
      done(err);
    }
  }
  keys.forEach(function(key){
    var filePath = path.join(self._dir, key);
    if(!path.relative(self._dir, filePath)) return got(key);

    fs.lstat(filePath, function(err, stats){
      if(err || !stats) return got(key);//miss
      if(stats.isDirectory()){//read dir
        var basedir = filePath;
        var gkvs;//base dir's key-value pairs
        readdirp(filePath, function(file, stats, cb){
          if(stats.isFile()){
            var k = path.relative(basedir, file);
            readFile(k, file, function(k, v){
              var parts = k.split(path.sep);
              gkvs || (gkvs = {});
              var hold = gkvs;
              for(var i=0; i<parts.length-1; ++i){
                var part = parts[i];
                if(!part) continue;
                hold[part] || (hold[part] = {});
                hold = hold[part];
              }
              hold[parts[parts.length-1]] = v;
              cb();
            }, cb);
          }
          else cb();
        }, function(err, result){
          if(err) return wrong(err);
          got(key, gkvs);
        });
      }else{//read file
        readFile(key, filePath, got, wrong);
      }
    });
  });
};


FileStore.prototype.del = function(keys, done){
  var self = this;
  var pending = keys.length, hasError = false;

  function got(){
    if(!--pending) return done(null);
  }
  function wrong(err){
    if(!hasError){
      hasError = true;
      done(err);
    }
  }

  keys.forEach(function(key){
    if(typeof key === 'string'){
      fs.remove(path.join(self._dir, key), function(err){
        if(err) return wrong(err);
        got();
      });
    }
    else if(key instanceof RegExp){
      readdirp(self._dir
      , function(file, stats, cb){
        var rel = path.relative('./dir', file);
        if(key.test(rel)){
          fs.remove(file, function(err){
            if(err) return cb(err);
            cb(null, false);
          });
        }else{
          cb();
        }
      }, function(err){
        if(err) return wrong(err);
        got();
      });
    }
  });
};

})();
