logger with multiple stores and auto context support
=================================

**DEPRECATED**

### Features

* normal debug/info/warn/error operation
* support time/timeEnd for profiling
* multiple stores(console/file/db...)
* **auto flush on process exit(SIGINT)**
* **log the context(through the web request...)**


### Usage

when you create a new logger object, you can set the following options:

* `stores`: store's map object. the key is the store instance's name. Each store has the common options:
    * `class`: the store class, which can be the package name string, or the require return
    * `level`: the threshold level(`DEBUG/INFO/WARN/ERROR/OFF`). default is `DEBUG`
    * `time`: whether to record time/timeEnd operation. default is `true`
* `context`: the context variable names. these variables are attached in the `process.domain`

if you do not set the `stores` option, a internal `ConsoleStore` will be used. it can also be retreived by `require('ctx-logger').ConsoleStore`.

```js
var Logger = require('ctx-logger');

//use the internal ConsoleStore
var logger = new Logger();
...

//create a logger with a console store and a file store
var logger = new Logger({stores: {
  console: {class: Logger.ConsoleStore},
  file: {class: 'ctx-logger-file-store', dir: './log'}
}});
...

logger.time('label a');
logger.debug('a debug message');
logger.info('a info message');
logger.warn('a warn message');
logger.error('a error message');
logger.timeEnd('label a');

```

### Used with context

In web http request, you may want to distinguish the differenct log messages produced by differenct users with the only one logger. Here, you can! see the code(with `express`):

```js
//add the domain middleware
app.use(function(req, resp, next){
  var reqDomain = require('domain').create();
  reqDomain.on('error', function (err) {
    /*error handler*/
  });

  //set the context var to the user id, assume it's kiliwalk
  reqDomain.userId = req.session.userId;
  
  reqDomain.add(req);
  reqDomain.add(resp);
  reqDomain.run(next);
});


var logger = new Logger({stores: {
  console: {class: Logger.ConsoleStore},
}, context: 'userId'});

app.get('/test', function(req, resp){
  logger.debug('visit test page');
});

```

the output will be:
```
2015-09-15 11:11:11 DEBUG [kiliwalk] visit test page
```

### Stores

* [internal console store](#Internal console store)
* [ctx-logger-file-store](https://www.npmjs.com/package/ctx-logger-file-store)


### Internal console store

you can choose whether enable colored output in console. just set the `color` option. default is `true`.
```js
var logger = new Logger({stores: {
  console: {class: Logger.ConsoleStore, color: false},
}});
```

### License :

Licensed under MIT

Copyright (c) 2015 [kiliwalk](https://github.com/kiliwalk)
