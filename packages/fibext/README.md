DEPRECATED! fibers with resume/wait to achieve non-async async
=================================

`a.js` file

```js
var fs = require('fs');
while(true){
  if(!fs.exists('upload-file.txt')){
    continue;
  }

  var data;
  try{
    data = fs.readFile('upload-file.txt', 'utf8');
  }catch(e){
    throw new Error('read error: '+ e.message);
  }
}

```

Without any callbacks! Code above does not block the nodejs main thread when call `fs.exists` and `fs.readFile`. All you need to do extra is to read below:)


I do not like Promise, yes I promise. This package is extended from [fibers](https://www.npmjs.com/package/fibers), with extra methods like `wait`/`resume`/`wrap`/`sleep`, much more stronger params passing and error handling, much more tolerable for nested run, automatically hung fiber stack and memory leak check, and expressjs support

### Features
* use `fibext`/`wait`/`resume` to archive fiber functionality, avoid callback hell
* supply express middleware to wrap every request, or you can use [tier](https://www.npmjs.com/package/tier) to achieve synchronouse stack filter for http request/response
* use `fibext.wrap` to wrap the node core module's async function and make it run as 'sync' style, like `var data = fs.readFile(xxx)`. 
* `fibext.wrap` also support sync function whose last parameter is callback. so you will never worry about whether the target function is async or not, as long as it returns everything from the callback
* use `fibext.async` to run a function in another fiber stack concurrently.
* `fibext` is an application-level singleton, which should be installed in the root of application. So any package required `fibext` should not put it in the `dependencies` part of `package.json` file, and mostly should check the version of `fibext` on loading(warn peferred if not satisfied). 

### Installation

```
npm install --save fibext
```

### Simple usage

```javascript
var fibext = require('fibext');
var fs = require('fs');
 
fibext(function(){
  fibext.sleep(1000);//sleep 1s

  var fiber = fibext();
  fiber.sleep(1000);//sleep 1s, same as fibext.sleep()
 
  //return value from the callback 
  setTimeout(function(){
    fiber.resume(null, 'wake up');
  }, 1000);
  var ret = fiber.wait();
  console.log(ret);//wake up 

  //throw the error from the callback
  setTimeout(function(){
    fiber.resume(new Error('xxx'));
  }, 1000);
  try{
    fiber.wait();//here will throw the error 'xxx'
  }catch(e){}
  
  //wrap the node module
  var ffs = fibext.wrap(fs); 
  var fileContent = ffs.readFile(__filename);//it will return the file data directly 

  //wrap function and call it
  fibext.wrap(fs.readFile)(__filename);
 
  return 'function return';
}, function(err, res){
  console.log(err, res); //null function return 
});
```

### Used with express

Or you can try [tier](https://github.com/kiliwalk/tier), a sync-run midlldeware imitating express

```js
app.use(fibext.express());//error will be redirected to error middleware
app.get('/sleep', function(req, resp){
  fibext.sleep(1000);
  resp.send('wake up').end();
});
```

### Parallel the async

```js
function get(url, cb){//get the response data from url
  cb(err, data);
}

fibext(function(){
  var fiber = fibext();
  get('url1', fiber.resume.bind(fiber));
  get('url2', fiber.resume.bind(fiber));
  get('url3', fiber.resume.bind(fiber));

  //data1 may not be the url1's result! it can be url2/url3's result too. 
  //you should not rely on that. same to data2/data3
  var data1 = fiber.wait();
  var data2 = fiber.wait();
  var data3 = fiber.wait();

  console.log(data1, data2, data3);
});
```

### More usages!

Please refer to the [test cases](https://github.com/kiliwalk/fibext/tree/master/test) to get more usage examples, like configuration, nested run, resume before wait, etc.

### API

#### `fibext([func], [done])`

Create a fiber stack, make the `func` to run in this stack. 
without any arguments, it will return the current instance in the fiber stack.

* `func`: the target function that its subsequent call chain need to be run as-like 'sync'
* `done`: the callback after the `func` returned or thrown

#### `fibext.set(name, value)` `get(name)` `config(name, [value])` `reset()` `resetConfig`

Get/set/reset the configuration. config keys has:

* `checkInterval`: int. the interval(ms) of the hung fiber stacks checking. default is `16000`
* `hungAfter`: int. consider a fiber stack being hung and might causing memory leak after the time(ms). default is `30000`.

#### `fibext.on('hung', listener)`

Bind a listener for hung fiber stack warning.

#### `fibext.sleep(ms)`

Sleep the current fiber stack with the specified miliseconds.

#### `fibext.express()`

Express middleware.

#### `fibext.wrap(functionOrObject, [deepTheFunction])`
Wrap node-style async functions to instead run in 'sync' style and return the value directly. 
this assumes that the last parameter of the function is the callback.
and it even support sync-callback function, so most time you don't need to care about whether the 
func is run in sync or async, just a function with last callback parameter is ok.

If a single function is passed then a wrapped function is created. if an object is passed then a
new object is returned with all functions wrapped.

There is no way to get the underlying function's return. if you need, please use the unwrapped ones,
such as `child_process.execFile`'s return `child`.

And you should not call the sync-style function from the wrap, like `readFileSync`, they will
block the fiber stack. use `underscore.pick` or `_.omit` to omit the sync-style functions.

```js
var readFile = fibext.wrap(require('fs').readFile);
var ffs = fibext.wrap(_.pick(require('fs'), 'readFile', 'writeFile'));
var request = fibext.wrap(require('request'), true);//wrap request and request.get ...

var fileContent = readFile('example.txt');
var fileContent = ffs.readFile('example.txt');
```

#### `fibext.async(func, done)`

Run the function in another fiber stack meanwhile. if `done` not supplied, then error will be `console.error`


#### `fiber.wait()`

Pause the fiber stack. wait should be used with resume and they must be **in pairs**. 
wait will return the **pair** resume's params, and assume that the first param is error or null. 
if it's error, then throw it. if not, then return the remain parts of the resume params. if 
the resume params's length = 2, then return the second param to adapt node-style callback. see:
```js
setTimeout(function(){
  fiber.resume(null, 'a');
});
fiber.wait();//return 'a'

setTimeout(function(){
  fiber.resume(null, 'a', 'b');
});
fiber.wait();//return ['a', 'b']

setTimeout(function(){
  fiber.resume(new Error('xxx'));
});
fiber.wait();//throw the error

//adapt to node-style callback
var fileContent = fiber.wait(fs.readFile('xxx', fiber.resume.bind(fiber)));
```

#### `fiber.resume([err, param1, param2, ...])`

Resume the paused fiber stack. the params will be used as the return of **this-pair**'s wait method;
if the first param is an Error, then the **pair** wait method will throw the error.

#### `fiber.sleep(ms)`

Same as `fibext.sleep(ms)`

### Coverage

run command `npm run test-cov` .
```
=============================== Coverage summary ===============================
Statements   : 98.52% ( 200/203 )
Branches     : 87.67% ( 64/73 )
Functions    : 100% ( 29/29 )
Lines        : 98.38% ( 182/185 )
================================================================================
```

### Benchmark with cps

Run command `npm run bench` to compare with the `setTimeout(fn, 0)` operation

```
cps:    64.72491909385114 op/s 15.45 ms/op
fibext: 64.80881399870383 op/s 15.43 ms/op
```


### License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
