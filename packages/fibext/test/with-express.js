/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('with express', () => {
  const fibext = require('../index');

  beforeEach(() => {
  });

  it('should run with normal processing and default error handling', function (done) {
    this.timeout(15000);

    const app = (require('express'))();
    const server = require('http').createServer(app);

    app.use(fibext.express());
    app.get('/test', (req, resp) => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(null, 'hello');
      }, 0);
      resp.send(fiber.wait()).end();
    });
    app.get('/error', (req, resp) => {
      const fiber = fibext();
      setTimeout(() => {
        fiber.resume(new Error('gun'));
      }, 0);
      fiber.wait();
    });
    app.use((err, req, resp, next) => {
      resp.send(err.message).end();
    });

    server.listen(8088, () => {
      const request = require('request');

      let pending = 2;
      function got() {
        if (!--pending) done();
      }

      request('http://127.0.0.1:8088/test', (err, resp, body) => {
        assert.equal(body, 'hello');
        got();
      });

      request('http://127.0.0.1:8088/error', (err, resp, body) => {
        assert.equal(body, 'gun');
        got();
      });
    });
  });
});
