(function(){
'use strict';

var Fiber = require('fibers');
var ExtFiber = require('./ext-fibers');

var domain = require('domain');
var Domain = domain.Domain;
if(Domain.prototype.wait && Domain.prototype.resume) return;//already bound

Domain.prototype.id = function(){
  return this._fiber && this._fiber._id;
};

var fnOldRun = Domain.prototype.run;
Domain.prototype.run = function(func){
  var self = this;
  var fiber = Fiber(function(){
    try{
      var ret;
      fnOldRun.call(self, function(){
        ret = func();
      });

      //exit the domain
      self.exit();
      // self.dispose(); //don't dispose the domain, for there may have some async job running!
      
      return ret;
    }catch(e){
      //terminate error should be returned directly, for it's called on first error occurs
      if(e instanceof ExtFiber.FiberTerminateError){
        return;
      }

      self.emit('error', e);
    }
  });
  self._fiber = new ExtFiber(fiber);
  fiber.run();
};

function prevWait(){
  if(!this._fiber) throw new Error('cannot wait in not-fiber stack');

  //check the fiber stack
  var before = this._fiber._id;
  var current = process.domain && process.domain.id();
  if(before !== current) throw new Error('cannot wait since the nbs has conflict');//may not happen anytime!
  this.exit();
  // console.log(before, process.domain && process.domain.id(), domain._stack.length);
}

function postWait(){
  //if async callback, then process.domain === this 
  //for node will auto set process.domain when async callback run
  if(process.domain!==this){
    this.enter();
  }
}

Domain.prototype.wait = function(){
  prevWait.call(this);
  var data = this._fiber.wait.apply(this._fiber, arguments);
  postWait.call(this);
  return data;
};

Domain.prototype.waitF = function(){
  prevWait.call(this);
  var data = this._fiber.waitF.apply(this._fiber, arguments);
  postWait.call(this);
  return data;
};

Domain.prototype.resume = function(){
  if(!this._fiber) throw new Error('cannot resume in not-fiber stack');
  return this._fiber.resume.apply(this._fiber, arguments);
};

})();