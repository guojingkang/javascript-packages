'use strict';

module.exports = TemplateMessage;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function TemplateMessage(instance){
  this.instance = instance;
}
var proto = TemplateMessage.prototype;

proto.send = function(openId, templateId, url, data){
  var params = {};
  params.touser = openId;
  params.template_id = templateId;
  params.url = url;
  params.data = data;

  var accessToken = this.instance.getAccessToken();
  var apiUrl = 'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token='+accessToken;
  var fiber = fibext();
  hr.post(apiUrl, {json: params}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();
  return body.msgid;
};