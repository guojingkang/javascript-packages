'use strict';

module.exports = Response;

var util = require('./util');

function Response(options){
  Object.defineProperties(this, {
    request: {value: options.request},
    instance: {value: options.instance},
  });
}
var proto = Response.prototype;

proto.text = function(text){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'text',
    Content: text,
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.image = function(mediaId){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'image',
    Image: {
      MediaId: mediaId,
    },
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.voice = function(mediaId){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'voice',
    Voice: {
      MediaId: mediaId,
    },
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.video = function(mediaId, options){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  options || (options = {});
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'video',
    Video: {
      MediaId: mediaId,
      Title: options.title,
      Description: options.desc,
    },
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.music = function(url, options){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  options || (options = {});
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'music',
    Music: {
      MusicURL: url,
      Title: options.title,
      Description: options.desc,
      HQMusicUrl: options.hqUrl,
      ThumbMediaId: options.thumbMediaId,
    },
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.news = function(items){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  var result;
  if(!items.xml){
    items = items.slice(0, 10);
    result = {xml: {ToUserName: this.request.openId, 
      FromUserName: this.request.instanceId,
      CreateTime:  ~~(Date.now()/1000),
      MsgType: 'news',
      ArticleCount: items.length,
      Articles: {
        item: []
      }
    }};

    //articles
    var articles = result.xml.Articles.item;
    for(var ii in items){
      var item = items[ii];
      var article = {Title: item.title, Description: item.desc, PicUrl: item.picUrl, Url: item.url};
      articles.push(article);
    }
  }else{//object, support orignial inputs: {xml: {}}
    result = items;
    result.xml.ToUserName = this.request.openId;
    result.xml.FromUserName = this.request.instanceId;
    result.xml.CreateTime = ~~(Date.now()/1000);
    result.xml.MsgType = 'news';
  }
  

  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};

proto.empty = function(){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  Object.defineProperties(this, {
    sent: {value: true},
    body: '',
  });
};

//redirect this and next messages to custom service system,
//then csr can contact with the user
proto.redirect2cs = function(){
  if(this.sent) throw new Error('Can\'t set message response body after sent');
  var result = {xml: {ToUserName: this.request.openId, 
    FromUserName: this.request.instanceId,
    CreateTime:  ~~(Date.now()/1000),
    MsgType: 'transfer_customer_service',
  }};
  Object.defineProperties(this, {
    sent: {value: true},
    body: {value: util.json2xml(result)},
  });
};