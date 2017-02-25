

function createResponse() {
  const response = { store: this };
  response.send = response.end = response.setState = send;
  return response;
}

function send(state) {
  this.store.setState(state);
}

module.exports = createResponse;
