

function createRequest(url, params) {
  const request = { body: params || {}, store: this };
  request.url = url;
  return request;
}

module.exports = createRequest;
