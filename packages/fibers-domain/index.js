(function(){
'use strict';

var fibers = require('fibers');

//注意在一个工作栈(或者请求)中, 不能有嵌套的fiber实例, 否则会导致互相干扰.
//不管是在同步方法中嵌套还是在异步里嵌套, 都是不允许的. 
//在同步方法里可以通过检测fibers.current来检查是否处于一个fiber实例中(目前sync方法自动支持);
//而在异步方法中则没有任何办法, 只能靠自己的代码了. 
//如果在异步中要(或者会)嵌套, 那么要确保该异步中不能再调用resume方法来返回到外部的fibers同步链中, 异步就只能在异步空间里执行了
//
//sync(function(){
//   var domain = process.domain;
//   //异步中嵌套sync:
//   setTimeout(function(){
//     sync(function(){
//       //xxxx
//     });
//     //注意这里不能再调用domain.resume(), 否则会导致fibers混乱, 造成不可预知的结果
//   }, 1);
//   //注意这里也不能再调用domain.wait(), 否则会导致fibers混乱, 造成不可预知的结果
  
//   //下面是一个正常的异步转同步方法
//   setTimeout(function(){
//     domain.resume();
//   }, 1);
//   domain.wait();
// });

//扩展Fiber功能, 同步方法中调用也不会破坏调用链
var seq = 0;
function ExtFiber(fiberInst){
  this._inst = fiberInst;//当前fibers实例
  this._id = seq = (++seq)%100000000;

  this._isWait = false;//表示当前fibers实例是否已经处于等待状态, 避免重复调用导致一直等待

  //用途: 如果回调是同步调用的, 那么在回调里调用resume方法时, 实际上还没有调用过wait方法.
  //此时打开该标记(true), 则当运行到wait方法时, 自然跳过, 而不是挂在那里导致整个线程挂起
  this._resumeBeforeWait = false;

  this._vars = null;//在resume方法中传入, 再由wait方法返回
}

ExtFiber.prototype.wait = function(){
  if(this._isWait) return;//avoid wait repeatly

  if(this._resumeBeforeWait){
    this._resumeBeforeWait = false;
    return this._vars;
  }

  //to wait
  this._isWait = true;
  fibers.yield();//执行此语句后, 代码会被"暂停", 等待resume的调用
  
  //当调用resume方法后, 才会执行到这里
  return this._vars;
};

//注意, 如果在resume前抛出异常, 那么fibers实例会进入僵尸状态: This Fiber is a zombie
ExtFiber.prototype.resume = function(vars){
  this._vars = vars;

  //只有当isWait=true时才调用fibers实例的run方法(避免resume before wait)
  if(this._isWait){
    this._isWait = false;
    this._inst.run();//执行完该方法后, 会立即执行wait后的代码(即同步方式)
    return;
  }
  else{//否则就是resume before wait
    this._resumeBeforeWait = true;
  }
};

//extend domain
var domain = require('domain');
var Domain = domain.Domain;
if(Domain.prototype.wait) return;//already injected

var fnOldRun = Domain.prototype.run;
Domain.prototype.run = function(func){
  var self = this;
  fibers(function(){
    //one fiber instance is running now
    //...
    self._fiber = new ExtFiber(fibers.current);//fibers.current只存在于同步调用中, 进入到异步方法后就没有了
    fnOldRun.call(self, func);
  }).run();
};

Domain.prototype.wait = function(){
  this._fiber.wait();
};

Domain.prototype.resume = function(){
  this._fiber.resume();
};

//run code in fibers context
module.exports.sync = function(cb, errorHandler, bindVars){
  if(fibers.current){//已存在于一个fiber实例中
    return cb();
  }

  var domInst = domain.create();
  domInst.on('error', errorHandler || function (err) {
    /*eslint-disable no-console*/
    console.log('got exception in domain: %s', err.message);
  });
  if(bindVars){
    for(var i in bindVars){
      domInst.add(bindVars[i]);
    }
  }
  domInst.run(cb);
};

})();
