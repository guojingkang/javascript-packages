'use strict';

module.exports = CustomService;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function CustomService(instance){
  this.instance = instance;
}
var proto = CustomService.prototype;

proto.add = function(){};

proto.text = function(openId, text, options){
  options || (options = {});

  var message = {
    touser: openId,
    msgtype: 'text',
    text: {
      content: text
    }
  };
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

proto.image = function(openId, mediaId, options, cb){
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  else options || (options = {});

  var message = {
    touser: openId,
    msgtype: 'image',
    image: {
      media_id: mediaId
    }
  };
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

proto.voice = function(openId, mediaId, options, cb){
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  else options || (options = {});
  
  var message = {
    touser: openId,
    msgtype: 'voice',
    voice: {
      media_id: mediaId
    }
  };
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

proto.video = function(openId, mediaId, options, cb){
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  else options || (options = {});
  
  var message = {
    touser: openId,
    msgtype: 'video',
    video: {
      media_id: mediaId,
      thumb_media_id: options.thumbMediaId,
      title: options.title,
      description: options.desc,
    }
  };
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

proto.music = function(openId, url, options, cb){
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  else options || (options = {});
  
  var message = {
    touser: openId,
    msgtype: 'music',
    music: {
      musicurl: url,
      hqmusicurl: options.hqUrl,
      thumb_media_id: options.thumbMediaId,
      title: options.title,
      description: options.desc,
    }
  };
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

proto.news = function(openId, items, options, cb){
  if(typeof options === 'function'){
    cb = options;
    options = {};
  }
  else options || (options = {});
  
  items = items.slice(0, 10);
  var message = {
    touser: openId,
    msgtype: 'news',
    news: {
      articles: [],
    }
  };
  var articles = message.news.articles;
  for(var ii in items){
    var item = items[ii];
    articles.push({title: item.title, description: item.desc, url: item.url, picurl: item.picUrl});
  }
  addCsr(message, options);
  sendCsMessage.call(this, message);
};

function addCsr(message, options){
  if(options.csr){
    message.customservice = {kf_account: options.csr};
  }
}

//send custom service message, always async
function sendCsMessage(csMessage){
  var token = this.instance.getAccessToken();
  var url = 'https://api.WeiXin.qq.com/cgi-bin/message/custom/send?access_token='+token;
  var fiber = fibext();
  hr.post(url, {json: csMessage}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  return fiber.wait();
}