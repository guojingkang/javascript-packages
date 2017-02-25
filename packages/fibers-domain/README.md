run in sequence, avoid callback-hell
=================================

**DEPRECATED**

fibers-domain extends node-fibers and node domain, to achieve code run in sequence and sync

### Usage

```javascript
var fd = require('fibers-domain');
fd.sync(function(){
  console.time('test');

  //sleep 1 second
  var domain = process.domain;
  setTimeout(function(){
    domain.resume();
  }, 1000);
  domain.wait();

  console.timeEnd('test')
});
```


### Use With Express

```javascript
require('fibers-domain');
app.use(function (req, resp, next) {
  var reqDomain = require('domain').create();
  reqDomain.on('error', function (err) {
    /*error handler*/
  });
  reqDomain.add(req);
  reqDomain.add(resp);
  reqDomain.run(next);
});
```

1. 创建一个domain middleware, 如上
2. 在后续请求的处理逻辑中, 可以直接使用`domain.resume()`和`domain.wait()`来进行顺序执行(不需要再使用sync创建上下文)
   

### Best Practice
因为web应用中, 基本上大部分的逻辑都是在处理请求, 所以可以认为大部分的逻辑都是在一个请求逻辑调用链中. 只要入口处使用fibers封装, 且所有的被调用者都按照fibers方式实现顺序执行, 那么整个调用链也可以认为是同步执行下去的. 具体操作方法

1. 在express的中间件或http请求监听中, 注入domain. 如上所示;
2. 在所有可能处于请求调用链上的方法中, 凡是有异步操作的内容, 均使用fibers-domain来将异步执行转化为顺序执行
3. 这样, 基本上所有的方法都不需要传入callback来执行, 因为方法已经同步化了

```javascript
require('fibers-domain');
app.use(/*domain middleware*/);
app.use('/query', function(req, resp, next){
  processRequest(req, resp);
});

function processRequest(req, resp){
  try{
    var r = queryDb();
    resp.json(r).end();
  }catch(e){
    resp.send(e.message);
  }
}

function queryDb(){
  var rows = null;
  var domain = process.domain, error = null;
  db.query(sql, function(err, _rows){
    error = err;
    rows = _rows;
    domain.resume();
  });
  domain.wait();
  if(error) throw error;
  return rows;
}
```

### Run with both async/sync callback
In [node-fibers](https://www.npmjs.com/package/fibers), if you run `fiber.run` in a sync callback(which means that you call `fiber.run` before `fiber.yield`), you will get a thrown error. But in fibers-domain, you can call `domain.resume()` in a sync callback without any throw.

```javascript
  function callbackSync(cb){
    /*do something*/
    cb();
  }

  fd.sync(function(){
    console.time('test');

    //sleep 1 second
    var domain = process.domain;
    callbackSync(function(){
      domain.resume();
    });
    domain.wait();

    console.timeEnd('test');
  });
```
So, no matter when you change the `callbackSync` method with an async cb or sync cb, the caller does not need to change the code.


## License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
