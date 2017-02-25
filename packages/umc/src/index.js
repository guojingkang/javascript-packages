

const compose = require('use-compose');
const createRequest = require('./request');
const createResponse = require('./response');
const createContainerComponent = require('./react');

class Store {
  constructor(initialState) {
    this.state = initialState || null;
    this._middlewares = [];
    this._subscribers = [];
  }

  use() {
    const len = arguments.length;
    for (let ii = 0; ii < len; ++ii) {
      const fn = arguments[ii];
      if (typeof fn !== 'function') throw new TypeError('use() only accept function');
      this._middlewares.push(fn);
    }
  }

  subscribe(fn) {
    this._subscribers.push(fn);
    const unsubscribe = () => this._subscribers.splice(this._subscribers.indexOf(fn), 1);
    return unsubscribe;
  }

  dispatch(url, params) {
    if (!url) throw new Error('url required');
    const req = createRequest.call(this, url, params);
    const resp = createResponse.call(this);

    return compose(this._middlewares).call(this, req, resp);
  }

  setState(newState) {
    if (newState === this.state) return;
    const oldState = this.state;
    this.state = Object.assign({}, oldState, newState);

    this._subscribers.forEach(fn => fn(this.state, oldState));
  }

  createContainer() {
    return createContainerComponent.apply(this, arguments);
  }
}

module.exports = exports = function (initialState) {
  return new Store(initialState);
};
