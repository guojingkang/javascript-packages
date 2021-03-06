(function(){
'use strict';


var Fiber = require('fibers');

function Pair(extFiber, enableRBW){
  this._fiber = extFiber;

  //indicate whether was already in wait status
  this._isWaited = false;

  //if call resume before wait, will set this prop to true. 
  //then on next wait method called, no wait anymore! 
  //to avaoid hung the whole fiber stack at the next wait method
  this._resumeBeforeWait = false;
  this._enableRBW = !!enableRBW;

  //array, passed in resume method, used by wait return
  this._cbArgs;
}

function waitReturn(returnFull){
  var args = this._cbArgs;
  this._cbArgs = undefined;

  if(!args || args.length<=0) return;

  if(args[0] instanceof Error) throw args[0];

  if(returnFull){
    if(args.length===1) return args[0];
    return args;
  }

  //node-style callback params
  if(args.length===1) return;//for cb(err)
  if(args.length===2) return args[1];//for cb(err, data)
  return args.slice(1);
}

function wait(){
  if(this._isWaited) return; //avoid wait repeatly, this may not happen anytime!

  if(this._enableRBW && this._resumeBeforeWait){
    this._resumeBeforeWait = false;
  }else{
    //to pause the fiber stack
    this._isWaited = true;

    if(arguments.length>1) Fiber.yield(arguments);
    else if(arguments.length===1) Fiber.yield(arguments[0]);
    else Fiber.yield();
  }
}

//return the resume arguments, without the first arg(assume it's error or null).
//if only two args, then the second will be returned
Pair.prototype.wait = function(){
  wait.apply(this, arguments);
  
  //after resume called
  return waitReturn.call(this);
};

//wait return full resume arguments, no matter whether first arg is error or not.
Pair.prototype.waitF = function(){
  wait.apply(this, arguments);
  
  //after resume called
  return waitReturn.call(this, true);
};

//resume the fiber stack from last wait position
//if an error was thrown before resume, it will trigger the domain error event [if in domain]
//or process uncaughtException event [if no domain]
Pair.prototype.resume = function(){
  var f = this._fiber;
  if(f._isTerminated) return;

  //avoid leak arguments: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
  var $_len = arguments.length; var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
  this._cbArgs = args;

  //only if was waited, the call fiber's run. otherwise it's resume before wait
  if(this._isWaited){
    this._isWaited = false;
    return f._inst.run();//after call run, the yield will return and the fiber stack will continue
  }
  else{//resume before wait
    this._enableRBW && (this._resumeBeforeWait = true);
  }
};

var seq = 0;
function ExtFiber(fiberInst){
  this._inst = fiberInst;//current Fiber instance
  this._id = seq = (++seq)%100000000;

  this._isTerminated = false;//indicate whether is terminated by error

  this._mainPair = new Pair(this, false);
}
module.exports = ExtFiber;

ExtFiber.prototype.wait = function(){
  return Pair.prototype.wait.apply(this._mainPair, arguments);
};
ExtFiber.prototype.waitF = function(){
  return Pair.prototype.waitF.apply(this._mainPair, arguments);
};
ExtFiber.prototype.resume = function(){
  return Pair.prototype.resume.apply(this._mainPair, arguments);
};

//terminate the fiber stack, usually used in error state
ExtFiber.prototype.terminate = function(){
  if(this._isTerminated) return;
  this._isTerminated = true;

  //currently do NOT support auto terminate, for the terminate error 
  //can be caught by user's try-catch block! just let it block in the
  //memory, though it may cause memory leak. so, typically, you should
  //NOT throw error in the async callback when the fiber stack is waited
  // try{
  //   this._inst.throwInto(new FiberTerminateError('terminate fiber stack'));
  // }catch(e){//may throw "This Fiber is not yielding", just ignore it

  // }
};

//create a new pair, enable resume-before-wait feature
ExtFiber.prototype.pair = function(){
  return new Pair(this, true);
};

function FiberTerminateError(msg){
  this.message = msg;
  this.isFiberTerm = true;
}
require('util').inherits(FiberTerminateError, Error);
module.exports.FiberTerminateError = FiberTerminateError;


})();
