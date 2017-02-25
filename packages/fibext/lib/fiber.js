'use strict';

var fibers = exports.fibers = [];

var Fiber = require('fibers');
var methods = require('./methods');

//extend node-fibers
var proto = Fiber.prototype;

proto.wait = function(){
  this._isWaited = true;
  this._waitedTime = Date.now();
  this._stack = stack();

  var args = Fiber.yield();//resume arguments
  this._isWaited = false;
  this._waitedTime = null;
  this._stack = null;
  return returnParams.apply(null, args);
};

proto.resume = function(err, res){
  if(!this._isWaited || this._fibextEnded) return returnParams.apply(null, arguments);
  this._isWaited = false;
  this._waitedTime = null;
  this.run(arguments);
};

//disable the reset
proto.reset = function(){
  return;
};

proto._end = function(){
  this._fibextEnded = true;
  for(var ii in fibers){
    if(fibers[ii]===this){
      fibers.splice(ii, 1);
      break;
    }
  }
};


proto.sleep = function(ms){
  setTimeout(this.resume.bind(this), ms);
  this.wait();
};

proto.async = methods.async;

function returnParams(){
  if(arguments.length<=0) return;
  var err = arguments[0];
  if(err) throw err;
  if(arguments.length>2){
    var remain = [], len = arguments.length;
    for(var ii=1; ii<len; ++ii) remain.push(arguments[ii]);
    return remain;
  }else{
    return arguments[1];
  }
}

function stack(){
  var old = Error.stackTraceLimit;
  Error.stackTraceLimit = 5;
  var error = {};
  Error.captureStackTrace(error);
  Error.stackTraceLimit = old;
  var stack = error.stack;
  stack = stack.slice(stack.indexOf('\n', stack.indexOf('\n', stack.indexOf('\n')+1)+1)+1);
  return stack;
}