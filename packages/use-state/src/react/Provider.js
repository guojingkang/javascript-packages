
const { Component, PropTypes, Children } = require('react');
const BasicStore = require('../basic-store');

class Provider extends Component {
  static propTypes = {
    store: PropTypes.instanceOf(BasicStore).isRequired,
    children: PropTypes.element.isRequired,
  }

  static childContextTypes = {
    store: PropTypes.instanceOf(BasicStore),
  }

  getChildContext() {
    return { store: this.props.store };
  }

  render() {
    return Children.only(this.props.children);
  }
}

module.exports = Provider;
