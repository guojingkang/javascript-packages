/*eslint-disable strict, no-console*/

var nbs = require('../index'), wait = nbs.wait, resume = nbs.resume;

var now = Date.now(), count = 0;
(function cpsTest(cb){
  if(++count>=100) return cb();
  setTimeout(function(){
    cpsTest(cb);
  }, 0);
})(function(){
  console.log('cps:', count/((Date.now()-now)/1000), 'op/s', (Date.now()-now)/count, 'ms/op');

  now = Date.now(), count = 0;
  (function nbsTest(cb){
    if(++count>=100) return cb();
    nbs.run(function(){
      setTimeout(function(){
        resume();
      }, 0);
      wait();
      nbsTest(cb);
    });
  })(function(){
    console.log('nbs:', count/((Date.now()-now)/1000), 'op/s', (Date.now()-now)/count, 'ms/op');
  });
});
  


    