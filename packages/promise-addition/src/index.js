
const extendStaticMembers = require('./static-members');
const extendInstaceMembers = require('./instance-members');

extendStaticMembers(Promise);
extendInstaceMembers(Promise);

module.exports = Promise;

