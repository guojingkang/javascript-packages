/* eslint-env mocha*/
/* eslint-disable strict, no-console*/

const assert = require('assert');

describe('with express', () => {
  let nbs = require('../index'),
    wait = nbs.wait,
    resume = nbs.resume;

  beforeEach(() => {
    nbs.resetConfig();
  });

  it('should run with normal processing and default error handling', function (done) {
    this.timeout(15000);

    const app = (require('express'))();
    const server = require('http').createServer(app);

    app.use(nbs.express());
    app.get('/test', (req, resp) => {
      setTimeout(() => {
        resume(null, 'hello');
      }, 100);
      resp.send(wait()).end();
    });
    app.get('/error', (req, resp) => {
      setTimeout(() => {
        (function () {
          throw new Error('gun');
        }());
      }, 100);
      const ret = wait();
      resp.send(ret).end();
    });
    app.get('/suberror', (req, resp) => {
      setTimeout(() => {
        (function () {
          throw new Error('async sub error');
        }());
      }, 10);
      setTimeout(() => {
        throw new Error('first error');
      }, 0);
    });
    app.use((err, req, resp, next) => {
      // if(err.isFiberTerm) return;
      resp.send(err.message).end();
    });

    server.listen(8088, () => {
      const request = require('request');

      let pending = 3;
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

      request('http://127.0.0.1:8088/suberror', (err, resp, body) => {
        assert.equal(body, 'first error');
        setTimeout(got, 10);
      });
    });
  });

  it('should run with custom error handling', function (done) {
    this.timeout(15000);

    const app = (require('express'))();
    const server = require('http').createServer(app);

    app.use(nbs.express({
      onError(err, req, resp) {
        resp.send(`fiber ${err.message}`).end();
      },
    }));
    app.get('/error', (req, resp) => {
      setTimeout(() => {
        (function () {
          throw new Error('gun');
        }());
      }, 100);
      const ret = wait();
      resp.send(ret).end();
    });

    server.listen(8087, () => {
      const request = require('request');

      request('http://127.0.0.1:8087/error', (err, resp, body) => {
        assert.equal(body, 'fiber gun');
        done();
      });
    });
  });

  it('should run with custom subsequent error handling', function (done) {
    this.timeout(15000);
    let pending = 2;
    function got() {
      if (!--pending) done();
    }

    const app = (require('express'))();
    const server = require('http').createServer(app);

    app.use(nbs.express({
      onError(err, req, resp) {
        resp.send(`fiber ${err.message}`).end();
      },
      onSubError(err) {
        assert.equal(err.message, 'gun 2');
        got();
      },
    }));
    app.get('/error', (req, resp) => {
      setTimeout(() => {
        throw new Error('gun 2');
      }, 10);
      setTimeout(() => {
        throw new Error('gun');
      });
      wait();
    });

    server.listen(8085, () => {
      const request = require('request');

      request('http://127.0.0.1:8085/error', (err, resp, body) => {
        assert.equal(body, 'fiber gun');
        got();
      });
    });
  });
});
