/*eslint-disable strict, no-console*/
var http = require('http');
var path = require('path');
// var util = require('util');

var memwatch = require('memwatch-next');
var heapdump = require('heapdump');

var snapFiles = [];
function snap(){
  var file = path.join(path.dirname(__dirname), 'snapshot', 
    path.basename(module.parent.filename, '.js')+'-'+process.pid + '-' + Date.now() + '.heapsnapshot');
  heapdump.writeSnapshot(file, function(err){
    snapFiles.push(file);

    if (err) console.error(err);
    else console.error('Wrote snapshot: ' + file);
  });
}


// var hd;
memwatch.on('leak', function(info) {
  console.error('Memory leak detected: ', info);

  // if (!hd) {
  //    console.log('1');
  //    hd = new memwatch.HeapDiff();
  //    console.log('2');
  //  } else {
  //    console.log('a');
  //    var diff = hd.end();
  //    console.log('b');
  //    console.error(util.inspect(diff, true, null));
  //    hd = null;
  //  }
  
  snap();
});

module.exports.start = function(callback, doSnap){
  process.on('SIGINT', function(){
    console.log('GOT SIGINT');
    if(doSnap){
      snap();
    }
    else if(snapFiles.length===1){
      require('fs').unlinkSync(snapFiles[0]);
    }
    process.exit();
  });

  var server = http.createServer(callback);
  server.setMaxListeners(0);

  server.listen(8080, function(){
    console.log('listening');
    snap();
  });
  return server;
};