
/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

// require('regenerator-runtime/runtime');
require('babel-register');

process.on('unhandledRejection', (reason) => {
  throw reason;
});

afterEach(function (done) {
  this.timeout(done, 10);
});

