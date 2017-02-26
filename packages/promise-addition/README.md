Extend native Promise in es6 with additional methods
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

### API
#### Promise.delay(ms: int)
Promise version of `setTimeout()`

#### Promise.promisify(input: function, options?: {context?: object, multiArgs?: boolean})
Promisify node callback-style function or the object who has these functions. 

#### Promise.fromCallback(func: (cb)=>any)
`func` is async function that called `cb` at the end, either `cb(null, result)` or `cb(err)`

#### Promise.each(input: array|promise, iterator: (item, index)=>any)
Run each item in the array with the iterator one by one, as opposed to `Promise.all()`. And return the result array with the same order of input. `input` can be an array or a promise that returns array. 
If someone in the iterator rejects/throws, promise will be rejected immediately and the remains will not be run.
This function is equal to `Promise.map(input, iterator, {concurrency: 1})`

#### Promise.map(input: array|promise, iterator: (item, index)=>any, options?: {concurrency?:Infinity})
Run the specified number(`concurrency`) items promises with the iterator concurrently. If one resolved, then run next one. Reject immediately if some one failed and remains will not be run.
If concurrency is Infinity or less than 1, then it equals to `Promise.all(input.map(iterator))`

#### Promise.reduce(input: array|promise, iterator: (prev, item, index)=>any, initialValue?: any)
Same like `array.reduce()`. Run each item in the array with the iterator one by one. Reject immediately if some one failed.

#### promise.timeout(ms: int, message?: string)
If the promise is fulfilled less than the specified time(ms), no timeout occurs. Otherwise it will be rejected with the timeout message(default `timeout`);

#### promise.delay(ms: int)
If the promise is fulfilled less than the specified time(ms), wait. 

#### promise.finally(callback: ()=>any)
If the promise fulfilled, run the finally callback first, then run `.then()` or `.catch()`. If the callback returns a rejected promise or throws an error, it will trigger the global `unhandledRejection` event(`process.on('unhandledRejection', cb)`). Others return will be ignored.

### Why not create a sub class for es6 native Promise?
First, I think extending native Promise is easy to use and safe enough for me.
Creating a sub class need to consider the static methods(like `resolve()`, `reject()`, `all()`), and there is a problem to do that. See: 
* [Problem with extending Promise](https://github.com/babel/babel/issues/1120)
* [Extending Promises in ES6](http://stackoverflow.com/questions/29333540/extending-promises-in-es6)

### License
Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
