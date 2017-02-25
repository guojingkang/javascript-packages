(function(){
'use strict';

var util = require('util');

var MyError = require('./error.js');

/**
 * mostly caused by the callee's own logic bug, that is, an unexpected error
 */
function BugError(){
  this.name = 'BugError';
  this.type = 'bug';
  this._class = BugError;
  MyError.apply(this, arguments);
}
util.inherits(BugError, MyError);
module.exports = BugError;

})();
