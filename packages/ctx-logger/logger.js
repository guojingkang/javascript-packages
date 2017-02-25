(function(){
'use strict';

var util = require('util');


var DEBUG = 10000, INFO = 20000, WARN = 30000, ERROR = 40000, OFF = 2147483647;
var lvlNum2Str = {};
lvlNum2Str[DEBUG] = 'DEBUG';
lvlNum2Str[INFO] = 'INFO';
lvlNum2Str[WARN] = 'WARN';
lvlNum2Str[ERROR] = 'ERROR';
var lvlStr2Num = {DEBUG: DEBUG, INFO: INFO, WARN: WARN, ERROR: ERROR, OFF: OFF};

module.exports.DEBUG = DEBUG;
module.exports.INFO = INFO;
module.exports.WARN = WARN;
module.exports.ERROR = ERROR;
module.exports.OFF = OFF;
module.exports.lvlNum2Str = lvlNum2Str;
module.exports.lvlStr2Num = lvlStr2Num;

function Logger(options){
  options || (options = {});

  if(!options.stores){
    options.stores = {console: {class: require('./console-store')}};
  }
  this._stores = {};
  for(var name in options.stores){
    var store = options.stores[name];
    store.name = name;
    store.logger = this;

    //store.class is the class, which will be string or the class function
    if(!store.class) continue;
    if(typeof store.class === 'string'){
      if(store.class==='console') store.class = require('./console-store');
      else store.class = require(store.class);
    }
    /*eslint-disable new-cap*/
    this._stores[name] = new store.class(store);
    /*eslint-enable new-cap*/
  }

  //context, which will put together with log messages. they are from process.domain
  if(!options.context){
    this._context = [];
  }else if(!Array.isArray(options.context)){
    this._context = options.context.replace(/\s*/g, '').split(',');
  }else{
    this._context = options.context;
  }

  this._timeLabels = {};
}
module.exports.Logger = Logger;

Logger.prototype.getStore = function(name){
  return this._stores[name];
};

Logger.prototype.flush = function(){
  for(var i in this._stores){
    this._stores[i].flush();
  }
};

var zeros = '0000000000';
function leftPad0(str, minLen){
  str += '';
  return zeros.substring(0, Math.max(minLen-str.length, 0))+str;
}
var spaces = '         ';
function rightPadSpace(str, minLen){
  return str+spaces.substring(0, Math.max(minLen-str.length, 0));
}
function formatDate(now){
  return now.getFullYear()+'-'+
    leftPad0(now.getMonth()+1, 2)+'-'+
    leftPad0(now.getDate(), 2)+' '+
    leftPad0(now.getHours(), 2)+':'+
    leftPad0(now.getMinutes(), 2)+':'+
    leftPad0(now.getSeconds(), 2)+'.'+
    leftPad0(now.getMilliseconds(), 3);
}

function getPrefix(slvl, now){
  var str = formatDate(now)+' '+rightPadSpace(slvl, 5)+' ';

  //add context
  for(var j in this._context){
    var name = this._context[j];
    if(process.domain && typeof process.domain[name]==='string'){
      str += '['+process.domain[name]+'] ';
    }
  }
  return str;
}

function log(lvl, args){
  var message = util.format.apply(null, args);
  var now = new Date();
  var prefix = getPrefix.call(this, lvlNum2Str[lvl], now);

  for(var i in this._stores){
    this._stores[i].log(lvl, prefix + message, now);
  }
}

Logger.prototype.debug = function(){
  log.call(this, DEBUG, arguments);
};
Logger.prototype.info = function(){
  log.call(this, INFO, arguments);
};
Logger.prototype.warn = function(){
  log.call(this, WARN, arguments);
};
Logger.prototype.error = function(){
  log.call(this, ERROR, arguments);
};

Logger.prototype.time = function(label){
  if(!label) return;
  this._timeLabels[label] = Date.now();
};

Logger.prototype.timeEnd = function(label){
  if(!label || !this._timeLabels[label]) return;
  var secs = (Date.now()-this._timeLabels[label])/1000;
  delete this._timeLabels[label];

  var message = label+' elapsed time: '+secs+'s';
  var now = new Date();
  var prefix = getPrefix.call(this, 'TIME', now);
  for(var i in this._stores){
    this._stores[i].logTime(prefix+message, now);
  }
};

})();
