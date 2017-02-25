(function(){
'use strict';

var path = require('path');
var jsConf = require('js-conf');
var fibext = require('fibext');

function Store(options){
  options || (options = {});
  this._dir = options.dir || './i18n';

  this._locales = {};//locale name and keys mapping
}
module.exports = Store;

function loadLocale(name){
  this._locales[name] = {};
  try{
    var fiber = fibext();
    jsConf.readFile(path.join(this._dir, name+'.json'), fiber.resume.bind(fiber));
    this._locales[name] = fiber.wait();
  }catch(e){
  }
  
}

Store.prototype.get = function(key, locales){
  for(var i in locales){
    var name = locales[i];
    if(!name) continue;

    if(!this._locales[name]) loadLocale.call(this, name);
    if(this._locales[name][key]) return this._locales[name][key];
  }
  return key;
};

Store.prototype.refresh = function(keys, locales){
  if(!locales){
    this._locales = {};
    return;
  }

  if(typeof locales === 'string'){
    locales = [locales];
  }

  for(var i in locales){
    var localeName = locales[i];
    this._locales[localeName] = undefined;
  }
};

})();
