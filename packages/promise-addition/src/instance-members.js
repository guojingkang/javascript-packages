
/* eslint no-extend-native: ["error", { "exceptions": ["Promise"] }]*/

// How many milliseconds at most we can wait the promise fulfilled
Promise.prototype.timeout = function timeout(ms, message) {
  if (ms > 0) {
    return Promise.race([
      this,
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const err = new Error(message || 'timeout');
          err.timeout = true;
          reject(err);
        }, ms);
      }),
    ]);
  }
  return this;
};


// How many milliseconds at least the promise would be treated as fulfilled
Promise.prototype.delay = function delay(ms) {
  return Promise.all([this, Promise.delay(ms)])
  .then(result => result[0]);
};


Promise.prototype.finally = function finalli(callback) {
  /* eslint-disable promise/catch-or-return */
  return this.then((result) => {
    try {
      return Promise.resolve(callback()).catch((e) => {
        Promise.reject(e);// trigger global unhandledRejection event
      }).then(() => result);
    } catch (e) {
      Promise.reject(e);// trigger global unhandledRejection event
      return result;
    }
  }, (err) => {
    try {
      return Promise.resolve(callback()).catch((e) => {
        Promise.reject(e);// trigger global unhandledRejection event
      }).then(() => Promise.reject(err));
    } catch (e) {
      Promise.reject(e);// trigger global unhandledRejection event
      return Promise.reject(err);
    }
    /* eslint-enable promise/catch-or-return */
  });
};

