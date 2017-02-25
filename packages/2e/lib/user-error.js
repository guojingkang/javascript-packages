(function(){
'use strict';

var util = require('util');

var MyError = require('./error.js');

/**
 * mostly caused by the caller's wrong, like invalid arguments, that is, a known error
 */
function UserError(){
  this.name = 'UserError';
  this.type = 'user';
  this._class = UserError;
  MyError.apply(this, arguments);
}
util.inherits(UserError, MyError);
module.exports = UserError;

})();
