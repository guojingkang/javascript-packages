'use strict';

module.exports = Qrcode;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');
var ms = require('ms');

function Qrcode(instance){
  this.instance = instance;

  this.temp = {
    create: createTemp.bind(this),
  };
  this.perm = {
    create: createPerm.bind(this),
  };
}

//temporary/unlimited qrcode
var maxExpire = 604800000;
function createTemp(value, expire){
  var data = {action_name: 'QR_SCENE', action_info: {scene: {}}};

  if(!value || typeof value !== 'number' || value%1!==0 || value<=0 || value>2147483647)
    throw new Error('Temporary qrcode require an 32bit positive integer scene value');
  
  data.action_info.scene.scene_id = value;

  if(expire){
    if(typeof expire === 'string') expire = ms(expire);
  }
  if(!expire || expire>maxExpire || !(expire>0)) expire = maxExpire;
  expire = ~~(expire/1000);//convert ms to seconds
  data.expire_seconds = expire;
  return send.call(this, data);
}

//permanent/limited qrcode
function createPerm(value){
  var data = {action_name: 'QR_LIMIT_STR_SCENE', action_info: {scene: {}}};
  var invalidMessage = 'Permanent qrcode require 1-64 length string or 1-100000 integer scene value';

  if(!value) throw new Error(invalidMessage);
  else if(typeof value === 'number'){
    data.action_name = 'QR_LIMIT_SCENE';
    if(value%1!==0 || value<=0 || value>100000) throw new Error(invalidMessage);
    data.action_info.scene.scene_id = value;
  }
  else if(typeof value === 'string'){
    if(value.length>64 || value.length<=0) throw new Error(invalidMessage);
    data.action_info.scene.scene_str = value;
  }else{
    throw new Error(invalidMessage);
  }
  return send.call(this, data);
}

function send(data){
  var token = this.instance.getAccessToken();
  var url = 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token='+token;
  var fiber = fibext();
  hr.post(url, {json: data}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();
  return {
    url: body.url, //the qrcode value, an url
    expire: (body.expire_seconds||0)*1000,
    image: 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+encodeURIComponent(body.ticket)
  };
}