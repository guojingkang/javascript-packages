'use strict';

module.exports = Media;

var hr = require('request');
var util = require('./util');
var fibext = require('fibext');

function Media(instance){
  this.instance = instance;
  this.temp = {
    get: permGet.bind(this),
  };
  this.perm = {
    get: permGet.bind(this),
    list: permList.bind(this),
    count: permCount.bind(this),
  };
}

function permGet(mediaId){
  var params = {media_id: mediaId};
  var accessToken = this.instance.getAccessToken();
  var url = 'https://api.weixin.qq.com/cgi-bin/material/get_material?access_token='+accessToken;
  var fiber = fibext();
  hr.post(url, {json: params}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  return fiber.wait();
}

function permCount(){
  var accessToken = this.instance.getAccessToken();
  var url = 'https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token='+accessToken;
  var fiber = fibext();
  hr.post(url, {json: true}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();
  return {voice: body.voice_count, video: body.video_count, image: body.image_count, news: body.news_count};
}

function permList(type, offset, count){
  var params = {type: type, offset: offset, count: count};
  var accessToken = this.instance.getAccessToken();
  var url = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token='+accessToken;
  var fiber = fibext();
  hr.post(url, {json: params}, util.processResponse(function(err, body){
    fiber.resume(err, body);
  }));
  var body = fiber.wait();

  var items = [];
  for(var ii in body.item){
    var old = body.item[ii], item = {};
    item.id = old.media_id;
    item.updated = old.update_time*1000;
    
    if(type==='news'){
      item.items = [];
      for(var jj in old.content.news_item){
        var oldNewsItem = old.content.news_item[jj];
        item.items.push({title: oldNewsItem.title, thumbMediaId: oldNewsItem.thumb_media_id,
          author: oldNewsItem.author, digest: oldNewsItem.digest, content: oldNewsItem.content,
          url: oldNewsItem.url});
      }
    }else{
      item.name = old.name;
      item.url = old.url;
    }
    items.push(item);
  }
  Object.defineProperty(items, 'total', {
    value: body.total_count
  });
  return items;
}