
module.exports = (Promise) => { // eslint-disable-line no-shadow
  const prototype = Promise.prototype;

  // How many milliseconds at most we can wait the promise fulfilled
  prototype.timeout = function timeout(ms, message) {
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
  prototype.delay = function delay(ms) {
    return Promise.all([this, Promise.delay(ms)])
    .then(result => result[0]);
  };


  prototype.finally = function finalli(callback) {
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

  prototype.nodeify = prototype.toCallback = prototype.asCallback = function asCallback(callback) {
    return this.then(ret => callback(null, ret), err => callback(err));
  };
};
