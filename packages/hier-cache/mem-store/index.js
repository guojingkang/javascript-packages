(function(){
'use strict';

function MemStore(options){
  options || (options = {});

  this._ttl = options.ttl || 0;//default ttl(ms) for all keys, 0 for unlimited
  this._algorithm = (options.algorithm || 'lru').toLowerCase();
  this._async = options.async;//async to set/get/del, usually for testing only

  this._data = {};
}
module.exports = MemStore;

//set the key
MemStore.prototype.set = function(kvs, options, done){
  options || (options = {});

  for(var key in kvs){
    var value = kvs[key];

    var ttl = +(options.ttl || this._ttl);
    var data = {value: value};
    if(ttl){
      data.expire = Date.now()+ttl;
    }

    var parent = this._data;//foothold
    var parts = key.split('/');
    for(var i=0; i<parts.length-1; ++i){
      var part = parts[i];
      if(!part) continue;
      if(!parent[part]) parent[part] = {};
      parent = parent[part];

      //discard parent's own data, for parent will be a container
      //use undefiend other than delete for performance: http://jsperf.com/delete-vs-undefined-vs-null/51
      parent['/'] = undefined;
    }
    var lastPart = parts[parts.length-1];
    parent[lastPart] = {'/': data};
  }

  if(this._async) setTimeout(done, 0);
  else done();
};

function getValue(hold){
  if(!hold) return undefined;

  var ret = {};
  for(var k in hold){
    var data = hold[k];
    if(k==='/' && (typeof data !== 'undefined')){//not a container
      if(data.expire && Date.now()>data.expire){
        return undefined;
      }
      return data.value;
    }
    else if(k!=='/'){
      var v = getValue(data);
      if(typeof v !== 'undefined'){
        ret[k] = v;
      }
      
    }
  }
  return ret;
}

MemStore.prototype.mget = function(keys, done){
  var ret = {};
  for(var i in keys){
    var key = keys[i];

    var hold = this._data;//foothold
    var parts = key.split('/'), j=0;
    for(; j<parts.length; ++j){
      var part = parts[j];
      if(!part) continue;
      if(!hold[part]) break;
      hold = hold[part];
    }
    if(j===parts.length){//has value
      if(hold===this._data){
        ret[key] = undefined;
      }
      else ret[key] = getValue(hold);
    }else{
      ret[key] = undefined;
    }
  }

  if(this._async) setTimeout(function(){
    done(null, ret);
  }, 0);
  else done(null, ret);
};

function readkeyp(obj, objPath, filter){
  var ret = [];
  if(!obj) return ret;
  if(arguments.length===2 && typeof objPath === 'function'){
    filter = objPath;
    objPath = '';
  }

  var keys = Object.keys(obj);
  for(var i in keys){
    var key = keys[i];
    if(key==='/') continue;

    var keyPath = objPath?(objPath+'/'+key):key;
    var isContainer = obj[key] && (typeof obj[key]['/']==='undefined') && Object.keys(obj[key]).length>1;
    var stat = {key: key, parent: obj, isContainer: isContainer};

    if(filter){
      var filterRet = filter(keyPath, stat);
      if(false!==filterRet) ret.push(filterRet);
    }
    else ret.push(keyPath);

    if(obj[key] && stat.isContainer){
      ret = ret.concat(readkeyp(obj[key], keyPath, filter));
    }
  }
  return ret;
}
MemStore.readkeyp = readkeyp;


MemStore.prototype.del = function(keys, done){
  for(var i in keys){
    var key = keys[i];
    if(typeof key === 'string'){
      var parent = this._data;//foothold
      var parts = key.split('/'), j;
      for(j=0; j<parts.length-1; ++j){
        var part = parts[j];
        if(!part) continue;
        if(!parent[part]) break;
        parent = parent[part];
      }
      var lastPart = parts[parts.length-1];
      if(j===parts.length-1){
        parent[lastPart] = undefined;
      }
    }
    else if(key instanceof RegExp){
      readkeyp(this._data, '', function(keyPath, stats){
        if(key.test(keyPath)){
          stats.parent[stats.key] = undefined;
          return false;
        }
      });
    }
  }

  if(this._async) setTimeout(done, 0);
  else done();
};

})();
