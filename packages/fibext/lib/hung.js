'use strict';

exports.createCheckItv = createCheckItv;
exports.on = on;

var EventEmitter = require('events').EventEmitter;
var colors = require('colors/safe');
var config = require('./config');
var fibers = require('./fiber').fibers;

colors.setTheme({
  warn: 'yellow',
  error: 'red',
});

var ee = new EventEmitter();

function on(){
  ee.on.apply(ee, arguments);
}

//the hung fibers check and memory leak warning
var itvCheckHung;
function createCheckItv(){
  if(itvCheckHung) clearInterval(itvCheckHung);
  itvCheckHung = setInterval(function(){
    var hungFibers = [];
    for(var ii in fibers){
      var fiber = fibers[ii];
      if(fiber._waitedTime && Date.now()-fiber._waitedTime>=config.get('hungAfter')){
        hungFibers.push(fiber);
      }
    }
    if(hungFibers.length<=0) return;
    if((ee.listenerCount && ee.listenerCount('hung')<=0) || EventEmitter.listenerCount(ee, 'hung')<=0){
      onhung(hungFibers);
    }
    else ee.emit('hung', hungFibers);
  }, config.get('checkInterval'));
  itvCheckHung.unref();
}
createCheckItv();

var line = '\n    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ';
function onhung(fibers){
  /*eslint-disable no-console*/
  console.warn(colors.error('WARNING! %s fiber(s) might be hung and cause memory leak'), fibers.length);
  var len = fibers.length;
  for(var ii=0; ii<len; ++ii){
    var fiber = fibers[ii];
    console.warn(colors.error(fiber._stack+line+ii));
  }
  /*eslint-enable no-console*/
}