'use strict';

module.exports = Message;

var util = require('./util');
var createRequest = require('./request');
var Response = require('./response');

function Message(instance){
  this.instance = instance;
  this._middlewares = [];
}
var proto = Message.prototype;

function checkSignature(signature, timestamp, nonce){
  var str = [this.instance.token, timestamp, nonce].sort().join('');
  if(signature === util.sha1(str)) return true;
  return false;
}

//to process the wx request
proto.request = function(method, query, xml){
  if(!checkSignature.call(this, query.signature, query.timestamp, query.nonce)){
    return 'invalid signature';
  }
  if(method==='GET'){
    return query.echostr;
  }
  var request = createRequest(xml, this.instance);
  var id = request.openId+'-'+request.created;
  if(!startRequest(id)) return '';
  var response = new Response({request: request, instance: this.instance});

  try{
    var self = this;
    var index = 0;
    (function next(){
      if(index>=self._middlewares.length){
        return;
      }
      var mw = self._middlewares[index++];
      if(mw.type===true || mw.type===request.type){
        mw.func(request, response, next);
      }else{
        next();
      }
    })();
    return response.body || '';
  }catch(e){
    util.onError.call(this.instance, e);
    return '';
  }finally{
    endRequest(id);
  }
};

proto.use = addMiddleware(true);
proto.text = addMiddleware('text');
proto.event = addMiddleware('event');

function addMiddleware(type){
  return function(){
    var len = arguments.length;
    for(var ii=0; ii<len; ++ii){
      var arg = arguments[ii];
      if(typeof arg !== 'function') continue;
      this._middlewares.push({type: type, func: arg});
    }
  };
}

var proceeding = {};//weixin message requests that are being proceeded now
function startRequest(id){
  if(proceeding[id]) return false;
  proceeding[id] = true;
  return true;
}
function endRequest(id){
  delete proceeding[id];
}
