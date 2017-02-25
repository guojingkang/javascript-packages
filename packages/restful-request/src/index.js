
/* global fetch*/

require('es6-promise').polyfill();
require('isomorphic-fetch');
const caseless = require('caseless');
const qs = require('qs');

const methods = 'get,post,put,post,delete'.split(',');

class RestfulClient {
  constructor(options = {}) {
    const { baseURL, headers } = options;
    if (!baseURL) throw new Error('baseURL option is required');

    this._baseURL = baseURL;
    this._headers = headers || {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    methods.forEach((method) => {
      this[method] = this._verb(method);
    });
  }

  async request(pathname = '/', data, options = {}) {
    if (typeof pathname !== 'string') throw new TypeError('pathname must be a string');
    if (options.files) return this.upload(pathname, data, options);

    let { headers, method, ...remainOptions } = options;
    if (!method) method = 'POST';

    const fetchOptions = {
      headers: { ...this._headers, ...headers },
      credentials: 'same-origin',
      ...remainOptions,
      method: method.toUpperCase(),
    };
    if (data) fetchOptions.body = body;

    let url = this._baseURL + pathname;

    headers = caseless(fetchOptions.headers);
    let body = fetchOptions.body;

    // parse the body
    if (body) {
      if (method === 'get') {
        url += `?${qs.stringify(body)}`;
        delete fetchOptions.body;
      } else if (headers.get('Content-Type').indexOf('application/json') >= 0) {
        fetchOptions.body = JSON.stringify(body);
      }
    }

    let resp;
    try {
      resp = await (timeout(fetch(url, fetchOptions), 30000));
      resp.body = await resp.text();

      if (resp.headers.get('Content-Type').indexOf('application/json') >= 0) {
        try {
          resp.body = JSON.parse(resp.body);
        } catch (e) {
          throw new Error('Invalid JSON received');
        }
      }

      const { status } = resp;
      if (status >= 300) {
        let message = resp.statusText;
        if (resp.body) {
          if (typeof resp.body === 'string') message = resp.body;
          else if (resp.body.message) message = resp.body.message;
        }
        throw new Error(message);
      }

      return resp;
    } catch (e) {
      e.response = resp;
      throw e;
    }
  }

  _verb(method) {
    return async (pathname = '/', data, options = {}) => {
      options.method = method;
      return this.request(pathname, data, options);
    };
  }
}

function timeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    }),
  ]);
}

module.exports = RestfulClient;
