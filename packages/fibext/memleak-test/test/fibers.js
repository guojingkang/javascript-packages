/*eslint-disable strict, no-console*/

//不会造成内存泄露

var fibext = require('../../index');

require('../lib/util').start(function(req, resp){
  fibext(function(){
    var list = [];
    for (var i=0; i<10; i++) {
      list.push({});
    }

    var f = fibext();
    setTimeout(function(){
      f.resume();
    }, 0);
    f.wait();
    resp.end('hello');
  });
});