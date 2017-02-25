(function(){
'use strict';

var fibext = require('fibext');
var MemStore = require('./mem-store');

function Cache(options){
  options || (options = {});

  if(!options.stores){
    options.stores = [{class: MemStore}];
  }
  this._stores = [];
  for(var i in options.stores){
    var store = options.stores[i];
    store.cache = this;

    //store.class is the class
    if(!store.class) continue;
    if(typeof store.class === 'string'){
      if(store.class==='mem') store.class = MemStore;
      else store.class = require(store.class);
    }
    /*eslint-disable new-cap*/
    this._stores.push(new store.class(store));
    /*eslint-enable new-cap*/
  }
}
module.exports = Cache;
Cache.MemStore = MemStore;


function concurrent(fns, cb){
  if(fns.length===1){
    return fns[0](cb);
  }

  var pending = fns.length, hasError = false;
  for(var i in fns){
    fns[i](function(err){
      if(err){
        if(!hasError){
          hasError = true;
          return cb(err);
        }
        else return;
      }
      if(!--pending) return cb();
    });
  }
}

//(key1, val1, key2, val2, ..., [options], [cb])
//([key1, val1, key2, val2, ...], [options], [cb])
//({key1: val1, key2: val2, ...}, [options], [cb])
function set(kvs, options, cb){
  if(Object.keys(kvs).length<=0){
    if(cb) return cb(new Error('empty key and value'));
    throw new Error('empty key and value');
  }

  var fns = [];
  for(var s in this._stores){
    var store = this._stores[s];
    fns.push(store.set.bind(store, kvs, options));
  }
  if(cb){
    concurrent(fns, cb);
  }else{
    var fiber = fibext(), rbw = false;//resume before wait
    concurrent(fns, function(){
      fiber.resume.apply(fiber, arguments);
      rbw = true;
    });
    rbw || fiber.wait();
  }  
}


function isPlainObject(obj) {
  return typeof obj == 'object' && Object.getPrototypeOf(obj) === Object.prototype;
} 

function parseSetArgs(key, options, cb){
  var kvs = {};
  if(Array.isArray(key) || isPlainObject(key)){
    if(Array.isArray(key)){
      for(var i=0; i<key.length; ++i){
        kvs[key[i]] = key[++i];
      }
    }
    else{
      kvs = key;
    }
    if(arguments.length===2){
      if(typeof options === 'function'){
        cb = options;
        options = null;
      }
    }
  }
  else{
    options = null, cb = null;
    for(var j=0; j<arguments.length; ++j){
      var k = arguments[j], v = arguments[++j];
      if(typeof k === 'function'){
        cb = k; 
        break;
      }
      if(isPlainObject(k)){
        options = k;
        cb = v;
        break;
      }
      kvs[k] = v;
    }
  }
  return {kvs: kvs, options: options, cb: cb};
}

function noop(){

}

Cache.prototype.setAsync = function(key, options, cb){
  var args = parseSetArgs.apply(this, arguments);
  set.call(this, args.kvs, args.options, args.cb || noop);
};

Cache.prototype.set = function(key, options){
  var args = parseSetArgs.apply(this, arguments);
  set.call(this, args.kvs, args.options);
};


function storeGetKeys(index, keys, gkvs, cb){
  var self = this;
  if(index>=self._stores.length) return cb(null, gkvs);
  var store = self._stores[index];
  store.mget(keys, function(err, kvs){
    if(err) return cb(err);

    keys = [];//remaining keys
    for(var k in kvs){
      if(undefined!==kvs[k]){
        gkvs || (gkvs = {});
        gkvs[k] = kvs[k];
      }
      else keys.push(k);
    }
    if(keys.length>0) return storeGetKeys.call(self, index+1, keys, gkvs, cb);
    return cb(null, gkvs);
  });
}

//key can be a hierachical path which sperates by /, like a/b/c
//if with multiple keys and stores, and some keys not found in preferential stores, 
//then the next stores will try to retreive these keys
//(key1, key2, ..., [cb])
//([key1, key2, ...], [cb])
function mget(keys, cb){
  if(!keys || keys.length<=0){
    if(cb) return cb(new Error('empty key'));
    else throw new Error('empty key');
  }

  var gkvs;//the return kvs
  if(cb){
    storeGetKeys.call(this, 0, keys, gkvs, cb);
  }
  else{
    var fiber = fibext();//resume before wait
    for(var j in this._stores){
      var store = this._stores[j];

      var rbw = false, kvs;
      store.mget(keys, function(){
        kvs = fiber.resume.apply(fiber, arguments);
        rbw = true;
      });
      rbw || (kvs = fiber.wait());

      keys = [];//remaining keys
      for(var k in kvs){
        if(undefined!==kvs[k]){
          gkvs || (gkvs = {});
          gkvs[k] = kvs[k];
        }
        else keys.push(k);
      }
      if(keys.length>0) continue;//not all found in this store, try next for remaining keys
      else break;
    }
    return gkvs;
  }
}
function parseGetArgs(keys, cb){
  if(!Array.isArray(keys)){
    cb = null;
    var tkeys = [];
    for(var i in arguments){
      if(typeof arguments[i] === 'function'){
        cb = arguments[i]; 
        break;
      }
      if(arguments[i]) tkeys.push(arguments[i]);
    }
    keys = tkeys;
  }

  return {keys: keys, cb: cb};
}
Cache.prototype.mgetAsync = function(keys, cb){
  var args = parseGetArgs.apply(this, arguments);
  if(!args.cb) return;
  mget.call(this, args.keys, args.cb);
};

Cache.prototype.mget = function(keys){
  var args = parseGetArgs.apply(this, arguments);
  return mget.call(this, args.keys);
};

Cache.prototype.getAsync = function(key, cb){
  if(!cb) return;
  mget.call(this, key && [key], function(err, kvs){
    if(err || !kvs) return cb(err, kvs);
    cb(null, kvs[key]);
  });
};

Cache.prototype.get = function(key){
  var kvs = mget.call(this, key && [key]);
  if(!kvs) return undefined;
  else return kvs[key];
};



//key can be a hierachical path which sperates by /, like a/b/c, or a regexp
//(key1, key2, ..., [cb])
//([key1, key2, ...], [cb])
function del(keys, cb){
  if(!keys || keys.length<=0){
    if(cb) return cb(new Error('empty key'));
    else throw new Error('empty key');
  }
  var fns = [];
  for(var j in this._stores){
    var store = this._stores[j];
    fns.push(store.del.bind(store, keys));
  }
  if(cb){
    concurrent(fns, cb);
  }else{
    var fiber = fibext(), rbw = false;
    concurrent(fns, function(){
      fiber.resume.apply(fiber, arguments);
      rbw = true;
    });
    rbw || fiber.wait();
  }
}


Cache.prototype.delAsync = function(keys, cb){
  var args = parseGetArgs.apply(this, arguments);
  del.call(this, args.keys, args.cb || noop);
};

Cache.prototype.del = function(keys){
  var args = parseGetArgs.apply(this, arguments);
  del.call(this, args.keys);
};

})();
