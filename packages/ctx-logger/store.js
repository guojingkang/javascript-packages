(function(){
'use strict';

var Logger = require('./logger');

var stores = [];
function Store(options){
  this._logger = options.logger;
  this._name = options.name;

  this._level = 0;
  this._time = true;//whether log time profiling information

  this.setLevel(options.level);
  if(options.hasOwnProperty('time')) this._time = (!!options.time) || false;

  stores.push(this);
}
module.exports = Store;

process.on('SIGINT', function flushLoggerStores() {
  var pending = stores.length;

  /*eslint-disable no-console*/
  console.log('flush all logger stores(', pending, ') on process SIGINT');

  for(var i in stores){
    stores[i].flush(function(){
      if(!--pending) process.exit();
    });
  }

  setTimeout(function(){
    console.warn('timeout SIGINT for flush logger');
    process.exit();
  }, 3000);
  /*eslint-enable no-console*/
});

Store.prototype.setLevel = function(lvl){
  if(!lvl) lvl = 0;
  else if(typeof lvl === 'string'){
    lvl = Logger.lvlStr2Num[lvl.toUpperCase()] || Logger.DEBUG;
  }
  else lvl = parseInt(lvl) || Logger.DEBUG;
  this._level = lvl;
};

Store.prototype.log = function(lvl, message, now){
  if(this._level>lvl) return;
  this.addLog(Logger.lvlNum2Str[lvl].toLowerCase(), message, now);
};

Store.prototype.logTime = function(message, now){
  if(!this._time) return;
  this.addLog('time', message, now);
};

//======================================
//the inherited class should implement these functions
// Store.prototype.addLog = function(level, message, now){
// };

// Store.prototype.flush = function(cb){
// };

})();
