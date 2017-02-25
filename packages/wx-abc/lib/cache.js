'use strict';

var data = {};

exports.set = function(k, v, options){
  options || (options = {});
  var item = {v: v};
  if(options.ttl) item.expire = options.ttl+Date.now();
  data[k] = item;
};

exports.get = function(k){
  if(!data[k]) return undefined;
  var item = data[k];
  if(item.expire && Date.now()>=item.expire){
    delete data[k];
    return undefined;
  }
  return item.v;
};

exports.flushAll = function(){
  data = {};
};
