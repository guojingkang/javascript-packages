/*eslint-disable strict, no-console*/

var fibext = require('../index');

var now = Date.now(), count = 0;
(function cpsTest(cb){
  if(++count>=100) return cb();
  setTimeout(function(){
    cpsTest(cb);
  }, 0);
})(function(){
  console.log('cps:', count/((Date.now()-now)/1000), 'op/s', (Date.now()-now)/count, 'ms/op');

  now = Date.now(), count = 0;
  (function fibTest(cb){
    if(++count>=100) return cb();
    fibext(function(){
      var fiber = fibext();
      setTimeout(function(){
        fiber.resume();
      }, 0);
      fiber.wait();
      fibTest(cb);
    });
  })(function(){
    console.log('fibext:', count/((Date.now()-now)/1000), 'op/s', (Date.now()-now)/count, 'ms/op');
  });
});
  


    