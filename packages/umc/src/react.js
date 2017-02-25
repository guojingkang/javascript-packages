

const React = require('react');

function createContainer(options) {
  options || (options = {});
  const stateName = options.stateName || 'appState';
  const passState = !!options.passState;

  const store = this;

  const Container = React.createClass({
    childContextTypes: {
      [stateName]: React.PropTypes.object.isRequired,
    },
    getChildContext() {
      return { [stateName]: this.state.appState };
    },
    getInitialState() {
      return { appState: store.state };
    },
    componentDidMount() {
      this._unmounting = false;
      this._unsubscribe = store.subscribe((state) => {
        if (this.state.appState && state === this.state.appState) return;
        this.setState({ appState: state });
      });
    },
    componentWillUnmount() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
    },
    render() {
      if (passState) {
        const props = { [stateName]: this.state.appState };
        return React.cloneElement(this.props.children, props);
      } else {
        return this.props.children;
      }
    },
  });

  Container.propTypes = {
    children: React.PropTypes.node.isRequired,
  };

  return Container;
}

module.exports = createContainer;
