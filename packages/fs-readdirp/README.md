simple readdirp with filter and sync/async version
=================================

**DEPRECATED**

### Features

* just traverse the file path, not the content of file
* readdirpSync for sync usecase

### Usage

#### `readdirpSync(dir, [filter])`

sync to read the dir. the result is an array, which contains the file path(no filter param) or the filter return

* `dir`: the start directory, which will not include in the result
* `filter`: the filter function `filter(filePath, stats)`. 
    * `filePath` is the full path for the sub dir or file. 
    * `stats` is the lstat return
    * the `return` value will be pushed at the result. if you return `false`, then this file will be ignored


#### `readdirp(dir, filter, done)`

async to read the dir.

* `filter`: `filter(filePath, stats, [callback])`. 
    * `callback`: `callback(err, ret)`. if no callback, then the `return` will be used in the result. otherwise, callback's `ret` parameter will be used in the result. if the `ret` param's value is false, the file will be ignored
* `done`: when finished, done is called. `done(err, results)`

```js
var readdirp = require('fs-readdirp').readdirp;
var readdirpSync = require('fs-readdirp').readdirpSync;

//read current directory's sub file path(absolute path)
var files = readdirpSync('.');


//read current directory's sub file relative path
var files = readdirpSync('.', function(filePath, stats){
  return require('path').relative('.', filePath);
});

//ignore all directory, only its files
var files = readdirpSync('.', function(filePath, stats){
  if(stats.isDirectory()) return false;
  return require('path').relative('.', filePath);
});

//async with no-callback filter: filter is sync
readdirp('.', function(filePath, stats){
  if(stats.isDirectory()) return false;
  return require('path').relative('.', filePath);
}, function(err, files){

});

//async with callback filter: filter is async
readdirp('.', function(filePath, stats, cb){
  if(stats.isDirectory()) cb(null, false);
  else cb(null, require('path').relative('.', filePath));
}, function(err, files){

});
```

### License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
