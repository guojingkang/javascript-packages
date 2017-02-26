
module.exports = (Promise) => { // eslint-disable-line no-shadow
  Promise.delay = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  function promisify(funcWithCallback, { context, multiArgs = false } = {}) {
    if (typeof funcWithCallback !== 'function') throw new Error('Only allow function to be promisified');
    return function promisifiedFunction(...args) { // eslint-disable-line func-names
      return new Promise((resolve, reject) => {
        funcWithCallback.call(context || this, ...args, (err, ...rets) => {
          if (err) return reject(err);
          else {
            if (multiArgs) return resolve(rets);
            return resolve(rets[0]);
          }
        });
      });
    };
  }

  // Promise.promisify(fs.readFile);
  // Promise.promisify([fs.readFile, fs.writeFile])
  Promise.denodeify = Promise.promisify = (input, options) => {
    if (Array.isArray(input)) {
      return input.map(func => promisify(input, options));
    } else {
      return promisify(input, options);
    }
  };

  Promise.denodeifyAll = Promise.promisifyAll =
    (obj, { suffix = 'Async', multiArgs = false, filter = defaultFilter } = {}) => {
      if (obj.__PromiseAdditionPromisified__) return obj;
      obj.__PromiseAdditionPromisified__ = true;

      for (const key in obj) {
        const value = obj[key];
        if (typeof value !== 'function') continue;
        if (!filter(value, key, obj)) continue;
        obj[key + suffix] = promisify(value, { multiArgs });
      }
      return obj;
    };

  // Promise.fromCallback((cb)=>cb(null, result));
  Promise.fromNode = Promise.fromCallback = function fromCallback(func) {
    return new Promise((resolve, reject) => {
      func((err, result) => {
        if (err) return reject(err);
        else return resolve(result);
      });
    });
  };

  // run the promises concurrently and return the result in a array with original order
  Promise.map = (input, iterator, { concurrency = Infinity } = {}) =>
    Promise.resolve(input).then((arr) => {
      if (concurrency === Infinity || !(concurrency > 0)) return Promise.all(arr.map(iterator));

      const len = arr.length;
      const result = new Array(len);

      let next = 0;// next one that will be run
      let error = null; // if an error occured, all remain ones will not be run

      function run(index) {
        if (index >= len || error) return Promise.resolve();
        next += 1;

        try {
          return Promise.resolve(iterator(arr[index], index)).then((ret) => {
            result[index] = ret;
            return run(next);
          }, (err) => {
            error = err;
            return Promise.reject(err);
          });
        } catch (e) {
          return Promise.reject(e);
        }
      }

      return Promise.all(new Array(concurrency).fill().map((val, index) => run(index)))
        .then(() => result, (err) => {
          error = null;
          next = null;
          return Promise.reject(err);
        });
    });

  // run the promises one by one and return the result in a array with original order
  Promise.each = (input, iterator) =>
    Promise.map(input, iterator, { concurrency: 1 });

  // run the promises one by one and reduce the array result to a value
  Promise.reduce = (input, iterator, initialValue) =>
    Promise.resolve(input).then(arr =>
      arr.reduce(
        (prev, value, index) =>
          prev.then(prevRet => iterator(prevRet, value, index)),
        Promise.resolve(initialValue),
      ),
    );
};

function defaultFilter(value, key, obj) {
  return true;
}
