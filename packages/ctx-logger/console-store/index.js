(function(){
'use strict';

var util = require('util');
var Store = require('../store');

function ConsoleStore(options){
  options || (options = {});

  Store.apply(this, arguments);

  this._color = true;
  if(options.hasOwnProperty('color')){
    this._color = (!!options.color) || false;
  }
}
util.inherits(ConsoleStore, Store);
module.exports = ConsoleStore;


var colors = require('colors/safe');
colors.setTheme({
  debug: 'white',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  time: 'red',
});

Store.prototype.addLog = function(level, message, now){
  /*eslint-disable no-console*/
  if(!this._color){
    console.log(message);
  }
  else{
    console.log(colors[level](message));
  }
  /*eslint-enable no-console*/
};

ConsoleStore.prototype.flush = function(cb){
  cb && cb();
};

})();
