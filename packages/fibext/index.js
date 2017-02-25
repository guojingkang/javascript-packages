'use strict';

//fibext module is an application-level singleton, 
//for fiber stack may run across mutiple modules.
if(global.__fibext){
  throw new Error('There should be only one fibext module');
}
global.__fibext = true;
module.exports = exports = fibext;
exports.version = require('./package.json').version;

var Fiber = require('fibers');
var fibers = require('./lib/fiber').fibers;
var methods = require('./lib/methods');
for(var ii in methods) exports[ii] = methods[ii];
var config = require('./lib/config');
for(var jj in config) exports[jj] = config[jj];
  
function fibext(fn, done){
  var fiber;

  //if empty args, then get current fiber
  if(arguments.length<=0){
    fiber = Fiber.current;
    if(!fiber) throw new Error('not in fiber stack');
    return fiber;
  }

  //otherwise, create a new fiber(or use the existing one) to run the `fn`
  if(typeof fn !== 'function'){
    throw new Error('fibext expect the argument to be a function');
  }

  //if already in a fiber stack, then run the `fn` directly
  if(Fiber.current){
    try{
      var ret = fn();
      if(done) done(null, ret);
    }catch(e){
      if(!done) throw e;
      done(e);
    }
    return;
  }

  //otherwise, create a new fiber stack
  var runDone = function(err, ret){
    if(!done) return;
    setImmediate(function(){//avoid the new fiber in `done` inherits current stack
      done(err, ret);
    });
  };
  fiber = Fiber(function(){
    try{
      var ret = fn();
      fiber._end();
      runDone(null, ret);
    }catch(e){
      fiber._end();
      if(!done) throw e;
      runDone(e);
    }
  });
  fiber._fibext = true;
  fibers.push(fiber);
  fiber.run();
}

