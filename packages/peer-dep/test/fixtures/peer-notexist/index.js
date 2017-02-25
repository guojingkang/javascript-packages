

const assert = require('assert');
const pd = require('../../..');
assert.doesNotThrow(() => {
  pd(module, true, { required: false });
});

pd(module, ['nonexistent-peer-module'], { required: true });
module.exports = true;
