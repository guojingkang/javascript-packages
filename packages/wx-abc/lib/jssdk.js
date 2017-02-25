'use strict';

module.exports = Jssdk;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function Jssdk(instance){
  this.instance = instance;
}
var proto = Jssdk.prototype;

function getTicket(){
  var cacheKey = 'weixin-js-api-ticket/'+this.instance.id;
  var token = this.instance._cache.get(cacheKey);
  if(!token){
    var fiber = fibext();
    var url = 'https://api.WeiXin.qq.com/cgi-bin/ticket/getticket?access_token='+
      this.instance.getAccessToken()+'&type=jsapi';
    hr.get(url, {json:true}, util.processResponse(function(err, body){
      fiber.resume(err, body);
    }));
    var body = fiber.wait();
    token = body.ticket;
    this.instance._cache.set(cacheKey, token, {ttl: (body.expires_in-5)*1000});//-5 to make it expired a little earlier
  }
  return token;
}
proto._getTicket = getTicket;//test only

proto.prepare = function(url){
  var nonceStr = Math.random().toString(36).substr(2, 15);
  var timestamp = ~~(Date.now()/1000);
  var jsApiTicket = getTicket.call(this);

  var str = 'jsapi_ticket='+jsApiTicket+'&noncestr='+nonceStr+'&timestamp='+timestamp+'&url='+url;
  var outputs = {appId: this.instance.appId, nonceStr: nonceStr, timestamp: timestamp, sign: util.sha1(str)};
  return outputs;
};