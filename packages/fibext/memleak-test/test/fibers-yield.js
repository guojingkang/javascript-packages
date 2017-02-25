/*eslint-disable strict, no-console*/

//会造成内存泄漏.

var fibext = require('../../index');

require('../lib/util').start(function(req, resp){
  fibext(function() {
      var fiber = fibext();
      resp.end('hello');
      fiber.wait();
      console.log(1);
  })();
});