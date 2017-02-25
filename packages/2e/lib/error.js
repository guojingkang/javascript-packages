(function(){
'use strict';

var util = require('util');

/**
 * 
 * 
 * call style example: 
 *   new UserError(format_messages);
 *   new UserError(code, format_messages);
 *   new UserError(err, format_messages);
 *   new UserError(err, code, format_messages);
 * while format_messages like `'foo %s bar %s', 'a', 'b'`
 */
function AbstractError(err){
  this.type;//the error's type
  this._class;//the error's class. will be delete after init
  this.code = 500;
  this.message = '';

  this.cause = null;//the error that caused the current error
  this.rootCause = null;

  var args = [], index = 0, len = arguments.length;
  for(; index<len; ++index) args.push(arguments[index]);
  index = 0;

  if(err instanceof Error){
    this.cause = err;
    if(err.rootCause) this.rootCause = err.rootCause;
    else this.rootCause = err;
    
    index ++;

    Object.defineProperty(this, 'stack', {
      get: function(){
        return this.name + ':' + this.messages + '\n' + 
          this.rootCause.stack.split('\n').slice(1).join('\n');
      },
    });
  }
  else{
    Error.captureStackTrace(this, this._class);
  }
  this._class = undefined;

  //get the explicit passed message
  var msg = '';//
  if(args.length>index){
    if(typeof args[index] === 'number'){
      this.code = args[index] || 500;
      index ++;
    }
    if(args.length>index) msg = util.format.apply(null, args.slice(index));
  }

  this.message = msg || this.message;
}
util.inherits(AbstractError, Error);
module.exports = AbstractError;

AbstractError.prototype.inspect = function(){
  return this.name + ':' + this.messages;
};

//return messages
Object.defineProperty(Error.prototype, 'messages', {
  get: function(){
    if(!this.cause) return ' ' + this.message;
    return (this.message?(' '+this.message + ':'):'') + this.cause.messages;
  },
});

})();
