'use strict';

module.exports = exports = {
  sleep: sleep,
  async: async,
  express: express,
  wrap: wrap,
  on: require('./hung').on
};

var fibext = require('..');
var util = require('util');

function sleep(ms){
  var fiber = fibext();
  fiber.sleep(ms);
}


//create another fiber stack and run meanwhile
function async(func, done){
  setImmediate(function(){
    fibext(func, done||onerror);
  });
}

function onerror(err){
  if(!err) return;
  var msg = util.format('catch unexpected error in async fiber stack: %s', err.stack||err.toString());
  console.error(msg);//eslint-disable-line no-console
}


function express(){
  return function (req, resp, next) {
    fibext(next, next);
  };
}


//inspired by `fibers/future`
function wrap(fnOrObj, deepForFn) {
  if (typeof fnOrObj === 'object') {
    var wrapped = Object.create(fnOrObj);
    for(var k in fnOrObj){
      if(wrapped[k] instanceof Function) {
        wrapped[k] = wrap(wrapped[k], deepForFn);
      }
    }
    return wrapped;
  } else if (typeof fnOrObj === 'function') {
    var fn = function() {
      //fibext wrapped function
      //avoid leak arguments: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
      var $_len = arguments.length; var args = new Array($_len); for(var $_i = 0; $_i < $_len; ++$_i) {args[$_i] = arguments[$_i];}
      
      var fiber = fibext(), rbw = false, ret;//rbw: resume before wait
      args.push(function(){
        ret = fiber.resume.apply(fiber, arguments);
        rbw = true;
      });
      fnOrObj.apply(this, args);
      rbw || (ret = fiber.wait());
      return ret;
    };
    fn.toString = function(){
      return 'fibext wrapped function: '+fnOrObj.toString();
    };

    // modules like `request` return a function that has more functions as properties. 
    if (deepForFn) {
      var proto = Object.create(fnOrObj);
      for (var pn in fnOrObj) {
        if (fnOrObj.hasOwnProperty(pn) && fnOrObj[pn] instanceof Function) {
          proto[pn] = proto[pn];
        }
      }
      fn.__proto__ = wrap(proto, false);
    }
    return fn;
  }
}
