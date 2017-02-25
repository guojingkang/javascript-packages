(function(){
'use strict';

var util = require('util');
var JsonStore = require('./json-store');

function i18n(options){
  options || (options = {});
  
  //the target locale and the fallbacks
  if(!options.locales){
    this._locales = ['en'];
  }
  else if(!Array.isArray(options.locales)){
    this._locales = [options.locales];
  }
  else{
    this._locales = options.locales;
  }

  //replace _ to -, eg. zh_CN->zh-CN
  for(var i in this._locales){
    this._locales[i] = this._locales[i].replace('_', '-');
  }

  //stores
  if(!options.stores){
    options.stores = [{class: JsonStore}];
  }
  this._stores = [];
  for(var j in options.stores){
    var store = options.stores[j];
    store.i18n = this;

    //store.class is the class
    if(!store.class) continue;
    if(typeof store.class === 'string'){
      if(store.class==='json') store.class = JsonStore;
      else store.class = require(store.class);
    }
    /*eslint-disable new-cap*/
    this._stores.push(new store.class(store));
    /*eslint-enable new-cap*/
  }
}
module.exports = i18n;
i18n.JsonStore = JsonStore;

i18n.prototype.t = function(key){
  if(!key) return key;

  var value;
  for(var i in this._stores){
    var store = this._stores[i];
    value = store.get(key, this._locales);
    if(!value) continue;
    else break;
  }

  if(value){
    var args = [value], len = arguments.length;
    for(var ii=1; ii<len; ++ii) args.push(arguments[ii]);
    return util.format.apply(null, args);
  }
  else return util.format.apply(null, arguments);
};


i18n.prototype.refresh = function(keys, locales){
  for(var i in this._stores) this._stores[i].refresh(keys, locales);
};

})();
