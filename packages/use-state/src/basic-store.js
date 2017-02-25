
const compose = require('use-compose');

// const createContainerComponent = require('./react');

class BasicStore {
  _state = null;
  _subscribers = [];// listeners called on state changed
  _middlewares = [];// middleware(funcitons) array
  _stack = null;// composed middleware

  constructor(options = {}) {
    const { state } = options;
    this._state = state || {};
  }

  get state() {
    return this._state;
  }

  use = (...middlewares) => {
    this._stack = null;
    for (const middleware of middlewares) {
      if (typeof middleware !== 'function') throw new TypeError('Only accept function in use()');
      this._middlewares.push(middleware);
    }
    return this;
  }

  subscribe = (listener) => {
    this._subscribers.push(listener);
    const unsubscribe = () => this._subscribers.splice(this._subscribers.indexOf(listener), 1);
    return unsubscribe;
  }

  dispatch = (url, body = {}) => {
    if (!url || typeof url !== 'string') throw new Error('Require url in dispatch()');

    if (!this._stack) this._stack = compose(this._middlewares);// cache stack

    const req = { store: this, method: true, url, body };
    const resp = this;

    return this._stack(req, resp);
  }

  setState(newState) {
    if (!newState || typeof newState !== 'object') return;
    if (newState === this._state) return;
    const oldState = this._state;
    this._state = newState;

    this._subscribers.forEach(listener => listener(newState, oldState));
  }

  // createContainer = (...args) => createContainerComponent(...args)
}

module.exports = BasicStore;
