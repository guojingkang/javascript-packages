'use strict';

module.exports = OAuth;

var fibext = require('fibext');
var hr = require('request');
var util = require('./util');

function OAuth(instance){
  this.instance = instance;
}
var proto = OAuth.prototype;

proto.url = function(callbackUrl, isBaseScope, state){
  state || (state = '');
  var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
    this.instance.appId +
    '&redirect_uri='+ encodeURIComponent(callbackUrl) +
    '&response_type=code&scope='+(isBaseScope?'snsapi_base':'snsapi_userinfo')+'&state='+state+
    '#wechat_redirect';
  return url;
};

proto.authorize = function(code){
  var url = 'https://api.WeiXin.qq.com/sns/oauth2/access_token?appid='+this.instance.appId+
    '&secret='+this.instance.appSecret+'&code='+code+'&grant_type=authorization_code';
  var fiber = fibext();
  hr.get(url, {json:true}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();

  // this.instance._cache.set('wx-oauth-token/'+this.instance.id, body.access_token, 
  //   {ttl: (body.expires_in-5)*1000});
  return {openId: body.openId, unionId: body.unionid, token: body.access_token, refresh: body.refresh_token,
    expire: Date.now()+(body.expires_in-5)*1000, isBaseScope: body.scope==='snsapi_base'};
};

proto.profile = function(authResult){
  if(authResult.isBaseScope) return {};

  //TODO check the token whether expired. if it is, then try to refresh token
  
  var url = 'https://api.WeiXin.qq.com/sns/userinfo?access_token='+authResult.token+
    '&openid='+authResult.openId +'&lang=zh_CN';
  var fiber = fibext();
  hr.get(url, {json:true}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  })); 
  var body = fiber.wait();

  return {openId: body.openid, unionId: body.unionid, nickName: body.nickname, sex: body.sex, 
    province: body.province, city: body.city, country: body.country, headImgUrl: body.headimgurl
  };
};