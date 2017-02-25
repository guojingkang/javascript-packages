'use strict';

module.exports = exports = {
  set: set,
  get: get,
  reset: reset,
  resetConfig: reset,
  config: config
};

var hung = require('./hung');

var defaultConf = {
  checkInterval: 16000,
  hungAfter: 30000,
};

var conf = {
  checkInterval: 0,//the interval(ms) to check fiber hung
  hungAfter: 0,//consider a fiber being hung after the time
};
for(var p in defaultConf){
  conf[p] = defaultConf[p];
}

function set(name, val){
  if(name==='checkInterval' && +val>0){
    conf.checkInterval = +val;
    hung.createCheckItv();
  }
  if(name==='hungAfter' && +val>0) conf.hungAfter = +val;
  return conf[name];
}

function get(name){
  return conf[name];
}

function config(name, val){
  if(arguments.length===1){
    return get(name);
  }
  else return set(name, val);
}

function reset(){
  for(var k in defaultConf){
    conf[k] = defaultConf[k];
  }
  return conf;
}
