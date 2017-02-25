
Promise.sleep = ms => new Promise(r => setTimeout(r, ms));

function promisifyFunc(funcWithCallback) {
  return function (...args) { // eslint-disable-line func-names
    return new Promise((resolve, reject) => {
      funcWithCallback(...args, (err, result) => {
        if (err) return reject(err);
        else return resolve(result);
      });
    });
  };
}

Promise.promisify = function promisify(input) {
  if (typeof input === 'function') {
    return promisifyFunc(input);
  } else {
    if (!input) return input;
    const result = {};
    for (const key in input) {
      const val = input[key];
      if (typeof val === 'function') {
        result[key] = promisifyFunc(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
};

Promise.fromCallback = function fromCallback(func) {
  return new Promise((resolve, reject) => {
    func((err, result) => {
      if (err) return reject(err);
      else return resolve(result);
    });
  });
};

// Concurrenty run the promise with the capacity
Promise.throttle = (input, size, callback) => {
  if (typeof size === 'function') {
    callback = size;
    size = 1;
  }

  return Promise.resolve(input).then((arr) => {
    const len = arr.length;
    const result = new Array(len);

    let next = 0;// next one that will be run
    let error = null; // if an error occured, all remain ones will not be run

    function run(index) {
      if (index >= len || error) return Promise.resolve();
      next += 1;

      try {
        return Promise.resolve(callback(arr[index], index)).then((ret) => {
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

    return Promise.all(new Array(size).fill().map((val, index) => run(index))).then(() => result, (err) => {
      error = null;
      next = null;
      return Promise.reject(err);
    });
  });
};

Promise.each = (input, callback) => Promise.throttle(input, 1, callback);
