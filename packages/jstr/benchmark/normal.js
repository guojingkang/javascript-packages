/*eslint no-console:0*/
'use strict';

var path = require('path');
var fibext = require('fibext');
var r = require('..')();

var count = 1000;
var now = Date.now();

var vars = {name: 'kiliwalk', arr: [1, 2, 3], obj: {k1: 'v1', k2: 'v2', k3: 'v3'}, bool: true};
fibext(function(){
  for(var ii=0; ii<count; ++ii){
    r.renderFile(path.join(__dirname, '../test/fixtures/single.html'), vars);
  }
  console.log((Date.now()-now)/1000);
});