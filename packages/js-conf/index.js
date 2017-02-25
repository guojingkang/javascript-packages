(function(){
'use strict';

var fs = require('fs');
var vm = require('vm');

function run(confFilePath, content, options){
  delete options.encoding;
  delete options.flag;

  var old = {};
  for(var kk in options){
    if(global.hasOwnProperty(kk)){
      old[kk] = global[kk];
    }
    global[kk] = options[kk];
  }

  try{
    return vm.runInThisContext('conf = '+ content, {filename: confFilePath});
  }catch(e){
    throw e;
  }finally{
    for(var ok in old){
      global[ok] = old[ok];
    }
  }
}

module.exports.readFileSync = function(confFilePath, options){
  options || (options = {});
  var content = fs.readFileSync(confFilePath, options);
  return run(confFilePath, content, options);
};

module.exports.readFile = function(confFilePath, options, cb){
  if(arguments.length==2 && typeof options==='function'){
    cb = options;
    options = {};
  }else{
    options || (options = {});
  }
  if(!cb) throw new Error('no callback in js-conf readFile');
  
  fs.readFile(confFilePath, options, function(err, content){
    if(err) return cb(err);

    cb(null, run(confFilePath, content, options));
  });
  
};

})();
