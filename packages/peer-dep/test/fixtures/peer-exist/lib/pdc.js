
const assert = require('assert');
const pd = require('../../../..');
pd(module);
pd(module, null);
pd(module, null, true);
pd(module, true, true);
pd(module, true, { required: true, strict: true });

assert.throws(() => {
  pd(module, 'not-defined');
}, 'Peer module `not-defined` required by `peer-exist` not defined in optionalPeerDependencies');
