(function(){
'use strict';

module.exports = require('./logger').Logger;
module.exports.Store = require('./store');
module.exports.ConsoleStore = require('./console-store');

})();
