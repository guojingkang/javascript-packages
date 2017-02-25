'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util'), format = util.format;
var semver = require('semver'), versionMatch = semver.satisfies;

var checkedModules = {};
module.exports = function check(mod, peerDepModNames, options){
  var modPkg = require(findModulePackageJsonFile(mod.filename));
  var modName = modPkg.name;
  var peerDeps = modPkg.optionalPeerDependencies || {};

  var deps = modPkg.dependencies;
  var depModName, errmsg;

  //dependencies in package.json should not contain any package name in optionalPeerDependencies
  if(!checkedModules[modName]){
    for(depModName in deps){
      if(peerDeps[depModName]){
        errmsg = format('Peer module `%s` required by `%s` should not be introduced in dependencies part', depModName, modName);
        throw new Error(errmsg);
      }
    }
    checkedModules[modName] = true;
  }

  if(arguments.length<=1) return;

  if(true === options) options = {required: true, strict: true};
  else options || (options = {});

  if(!peerDepModNames) return;
  else if(true === peerDepModNames) peerDepModNames = Object.keys(peerDeps);
  else if(!Array.isArray(peerDepModNames)) peerDepModNames = [peerDepModNames];
  for(var ii in peerDepModNames){
    depModName = peerDepModNames[ii];
    if(!peerDeps[depModName]){
      errmsg = format('Peer module `%s` required by `%s` not defined in optionalPeerDependencies', 
        depModName, modName);
      throw new Error(errmsg);
    }

    //check existent
    var depModPath;
    try{
      depModPath = require.resolve(depModName);
    }catch(e){//not found
      if(options.required){
        errmsg = format('Peer module `%s` required by `%s` not found. Please run: npm install --save %s@"%s"', 
          depModName, modName, depModName, peerDeps[depModName]);
        throw new Error(errmsg);
      }
      else continue;
    }

    //check version
    var depModPkg = require(findModulePackageJsonFile(depModPath));
    var version = depModPkg.version;
    if(!versionMatch(version, peerDeps[depModName])){
      errmsg = format('Version "%s" of peer module `%s` required by `%s` does not satisfy version range "%s"', 
        version, depModName, modName, peerDeps[depModName]);
      if(options.strict){
        throw new Error(errmsg);
      }else{
        console.warn('WARNNING!!! '+errmsg);//eslint-disable-line no-console
      }
    }
  }
};

function findModulePackageJsonFile(modulePath){
  var dir = path.dirname(modulePath);
  while(true){//eslint-disable-line no-constant-condition
    var filePath = path.join(dir, 'package.json');
    if(!fs.existsSync(filePath)){
      var parDir = path.dirname(dir);
      if(parDir===dir) throw new Error('Cannot find the package.json of module: '+modulePath);
      dir = parDir;
    }
    else return filePath;
  }
}
