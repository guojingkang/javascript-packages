'use strict';

module.exports = Instance;

var util = require('./util');
var EventEmitter = require('events').EventEmitter;
var fibext = require('fibext');
var hr = require('request');
var innerCache = require('./cache');

var OAuth = require('./oauth');
var Message = require('./message');
var Cs = require('./cs');
var Menu = require('./menu');
var Qrcode = require('./qrcode');
var TMessage = require('./t-message');
var Media = require('./media');
var Jssdk = require('./jssdk');
var Pay = require('./pay');

function Instance(options){
  EventEmitter.call(this);
  options || (options = {});

  this.id = options.id;//instance's open id, which you can find in "公众号设置->原始ID"
  this.token = options.token;
  this.appId = options.appId;
  this.appSecret = options.appSecret;

  this._cache = options.cache || innerCache;

  Object.defineProperties(this, {
    oauth: {value: new OAuth(this)},
    message: {value: new Message(this)},
    cs: {value: new Cs(this)},
    menu: {value: new Menu(this)},
    qrcode: {value: new Qrcode(this)},
    tmessage: {value: new TMessage(this)},
    media: {value: new Media(this)},
    jssdk: {value: new Jssdk(this)},
    pay: {value: new Pay(this, options.merchantId, options.merchantKey, options.pfx)},
  });
}
util.inherits(Instance, EventEmitter);
var proto = Instance.prototype;

proto.getAccessToken = function(){
  var cacheKey = 'weixin-access-token/'+this.id;
  var token = this._cache.get(cacheKey);
  if(!token){
    var fiber = fibext();
    var url = 'https://api.WeiXin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+this.appId+
      '&secret='+this.appSecret;
    hr.get(url, {json:true}, util.processResponse(function(err, body){
      fiber.resume(err, body);
    }));
    var body = fiber.wait();
    token = body.access_token;
    this._cache.set(cacheKey, token, {ttl: (body.expires_in-5)*1000});//-5 to make it expired a little earlier
  }
  return token;
};









