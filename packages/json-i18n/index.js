(function(){
'use strict';

var path = require('path');
var util = require('util');
var jsConf = require('js-conf');

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

  this._dir = options.dir || './i18n';
  this._data = {};//locale name and keys mapping

  for(var j in this._locales) loadData.call(this, this._locales[j]);
}
module.exports = i18n;

function loadData(name){
  if(!name) return;

  this._data[name] = {};
  try{
    this._data[name] = jsConf.readFileSync(path.join(this._dir, name+'.json'));
  }catch(e){
  }
}

i18n.prototype.t = function(key){
  if(!key) return key;

  var value = key;
  for(var i in this._locales){
    var name = this._locales[i];
    if(!name) continue;

    if(!this._data[name]) loadData.call(this, name);
    if(typeof this._data[name][key] === 'string'){
      value = this._data[name][key];
      break;
    }
  }

  var args = [value], len = arguments.length;
  for(var ii=1; ii<len; ++ii) args.push(arguments[ii]);
  return util.format.apply(null, args);
};

})();
