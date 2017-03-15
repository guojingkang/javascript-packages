Extend native Promise in es6 with additional helper methods
=================================

### Example
```js
// inject methods to native Promise
import 'promise-addition'; 

// promisify the function
const readFile = Promise.promisify(require('fs').readFile);
readFile(__filename, 'utf8')
  .then(content => console.log(content));

// run function with callback injected
Promise.fromCallback(function (callback) {
  callback(null, result); // or callback(err);
}).then((result) => {});

// wait 10ms
Promise.delay(10)
  .then(() => console.log('10ms past'));

// run each item promise one by one
Promise.each([1, 2, 3], (val, index) => val + 1)
  .then(result => console.log(result));// [2, 3, 4]

// run all promises concurrently
Promise.map([1, 2, 3, 4], (val, index) => val + 1)
  .then(result => console.log(result));// [2, 3, 4, 5]

// run 2 promises concurrently
Promise.map([1, 2, 3, 4], (val, index) => val + 1, {concurrency: 2})
  .then(result => console.log(result));// [2, 3, 4, 5]

// if query not completed in 10 seconds, reject as timeout
db.query().timeout(10000); 

// if query completed less than 10 seconds, wait then go next
db.query().delay(10000);

// use finally() to release resources
db.query()
  .finally(() => db.disconnect())
  .then(users => console.log(users))
  .catch(err => console.log(`query error: ${err.message}`));

```

### Static Methods

#### .delay(ms: int)
Promise version of `setTimeout()`

#### .promisify(input: function|array, options?: object)
*Alias Promise.denodeify()*  
Return a promified function for node callback-style function. options:  
* `context`: object
* `multiArgs`: boolean, default false
```js
const readFile = Promise.promisify(fs.readFile)
const content = await readFile('/path/to/file', 'utf8');
```

#### .promisifyAll(obj: object, options?: object)
*Alias Promise.denodeifyAll()*  
Modify the object, and create new functions with the suffix for all functions by `promisify()`. options:  
* `suffix`: string, default 'Async'
* `multiArgs`: boolean, default false
* `filter`: function, (value, key, obj)=>bool, default `()=>true`
```js
const fs = Promise.promisifyAll(require('fs'));
const content = await fs.readFileAsync('/path/to/file', 'utf8');
```

#### .fromCallback(func: (cb)=>any, options?: {multiArgs?: boolean})
*Alias Promise.fromNode()*  
`func` is a function that called `cb` at the end, either `cb(null, result)` or `cb(err)`.
```js
const content = await Promise.fromCallback(cb=>fs.readFile('/path/to/file', 'utf8', cb));

//compare to promisify()
const content = await Promise.promisify(fs.readFile)('/path/to/file', 'utf8');
```

#### .each(input: array|promise, iterator: (item, index)=>any)
Run each item in the array with the iterator one by one, as opposed to `Promise.all()`. And return the result array with the same order of input. `input` can be an array or a promise that returns array. 
If someone in the iterator rejects/throws, promise will be rejected immediately and the remains will not be run.
This function is equal to `Promise.map(input, iterator, {concurrency: 1})`

#### .map(input: array|promise, iterator: (item, index)=>any, options?: {concurrency?:Infinity})
Run the specified number(`concurrency`) items promises with the iterator concurrently. If one resolved, then run next one. Reject immediately if some one failed and remains will not be run.
If concurrency is Infinity or less than 1, then it equals to `Promise.all(input.map(iterator))`

#### .reduce(input: array|promise, iterator: (prev, item, index)=>any, initialValue?: any)
Same like `array.reduce()`. Run each item in the array with the iterator one by one. Reject immediately if some one failed.

### Instance Methods

#### .timeout(ms: int, message?: string)
If the promise is fulfilled less than the specified time(ms), no timeout occurs. Otherwise it will be rejected with the timeout message(default `timeout`);

#### .delay(ms: int)
If the promise is fulfilled less than the specified time(ms), wait. 
```js
await Promise.delay(5).delay(15).delay(25)
//about 25 ms elapsed, but less than 30ms(25+5) and 45ms(25+5+15)
```

#### .finally(callback: ()=>any)
If the promise fulfilled, run the finally callback first, then run `.then()` or `.catch()`. If the callback returns a rejected promise or throws an error, it will trigger the global `unhandledRejection` event(`process.on('unhandledRejection', cb)`). Others return will be ignored.

#### .asCallback(cb: function)
*Alias .nodeify(), .toCallback()*  
Restore promise to callback style.
```js
const readFile = Promise.promisify(fs.readFile);

function originalReadFile(path, options, cb){
  readFile(path, options).asCallback(cb)
}
```

### Why not create a sub class for es6 native Promise?
First, I think extending native Promise is easy to use and safe enough for me.
Creating a sub class need to consider the static methods(like `resolve()`, `reject()`, `all()`), and there is a problem to do that. See: 
* [Problem with extending Promise](https://github.com/babel/babel/issues/1120)
* [Extending Promises in ES6](http://stackoverflow.com/questions/29333540/extending-promises-in-es6)
Maybe using prototype other than class can fix this problem.

### License
Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
