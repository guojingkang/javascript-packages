Extend native Promise in es6 with additional methods
=================================

### Example
```js
import 'promise-addition';

const fs = Promise.promisify(require('fs'));
fs.readFile(__filename, 'utf8').then(content => console.log(content));

Promise.fromCallback(function (callback) {
  callback(null, result); // or callback(err);
}).then((result) => {});

Promise.sleep(10).then(() => console.log('10ms past'));

Promise.each([1, 2, 3], (val, index) => val + 1).then(result => console.log(result));// [2, 3, 4]

// run 3 promises concurrently all the time
Promise.throttle([1, 2, 3, 4], 3, (val, index) => val + 1).then(result => console.log(result));// [2, 3, 4, 5]

db.query().timeout(10000); // if query not completed in 10 seconds, reject as timeout

db.query().delay(10000); // if query completed less than 10 seconds, wait then go next

db.query()
  .finally(() => db.disconnect()) // use finally() to release resources
  .then(users => console.log(users))
  .catch(err => console.log(`query error: ${err.message}`));

```

### API
#### Promise.sleep(ms: int)
Promise version of `setTimeout()`

#### Promise.promisify(input: function|object)
Promisify node callback-style function or the object who has these functions. 

#### Promise.fromCallback(func: (cb)=>any)
`func` is async function that called `cb` at the end, either `cb(null, result)` or `cb(err)`

#### Promise.each(input: arr|promise, callback: (item, index)=>promise)
`input` can be an array or a promise that returns array. Run each item in the array with the callback one by one, as opposed to `Promise.all()`. If someone in the callback rejects/throws, promise will be rejected immediately and the remains will not be run.
This function is same as `Promise.throttle(input, 1, callback)`

#### Promise.throttle(input: arr|promise, concurrentNum: int, callback: (item, index)=>promise)
Run the specified number items with the callback concurrently. If one resolved, then run next one. Reject immediately if some one failed.

#### promise.timeout(ms: int, message?: string)
If the promise is fulfilled less than the specified time(ms), no timeout occurs. Otherwise it will be rejected with the timeout message(default `timeout`);

#### promise.delay(ms: int)
If the promise is fulfilled less than the specified time(ms), wait. 

#### promise.finally(callback: ()=>any)
If the promise fulfilled, run the finally callback first, then run `.then()` or `.catch()`. If the callback returns a rejected promise or throws an error, it will trigger the global `unhandledRejection` event(`process.on('unhandledRejection', cb)`). Others return will be ignored.


### License
Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
